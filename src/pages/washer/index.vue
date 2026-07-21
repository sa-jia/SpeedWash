<script setup>
import { PAYMENT_FROM, PAYMENT_METHOD, IOT_STATUS } from "@/constants";

// Feature flag — pasar a true cuando RR.PP. confirme % de descuento
// por pago en efectivo y la operatoria en sucursal. Default off al lanzamiento.
const SHOW_CASH_OFFER = false;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const id = route.params.id;

const { success } = usePaymentResult();

// 加载状态
const isLoading = ref(true);
const error = ref(null);

// 洗车机详情数据
const { data: washerData, error: washerError, isFetching } = washApi.iotInfo(id);

// 洗车方案
const washPlans = computed(() => washerData.value?.schemeList || []);

// VIP卡列表
const vipCards = computed(() => washerData.value?.vipCardList || []);

// La máquina solo se puede iniciar si está disponible
const canWash = computed(
  () => washerData.value?.iotStatus === IOT_STATUS.AVAILABLE
);

// El vendor nombra el plan con cera como "Lavado Premium"; en la marca
// SpeedWash se muestra como "Lavado SpeedWash con Cera". Override de display.
const displayPlanName = (name = "") => {
  if (/premium/i.test(name)) return t("routes.washer.planName.premium");
  return name;
};

// Parte el nombre del plan en 2 líneas: "Lavado Plus" -> ["Lavado", "Plus"]
const splitPlanName = (name = "") => {
  const display = displayPlanName(name);
  const idx = display.indexOf(" ");
  if (idx === -1) return { first: display, rest: "" };
  return { first: display.slice(0, idx), rest: display.slice(idx + 1) };
};

// 其他状态
const selectedPlan = ref(null);
const selectedCard = ref(null);
const showVipCards = ref(false);

// 订单金额
const orderAmount = ref(0);

// Tarjeta VIP (pack) aplicable al plan elegido: una tarjeta solo vale para su
// mismo `mark`. Nada se consume hasta apretar "Iniciar lavado".
const applicableCard = computed(
  () => vipCards.value.find((c) => c.mark === selectedPlan.value?.mark) || null
);

const formatPrice = (cents) =>
  "$" + Math.round((Number(cents) || 0) / 100).toLocaleString("es-AR");

// ─────────────────────────────────────────────────────────────────────────
// Banda de costo (nuevo rediseño). Reemplaza tanto el "$Total" del action-bar
// (que era ambiguo con pack) como la pack-row chiquita de arriba. La idea:
// cuando el pack cubre, gritar "$0 gratis" con el precio original tachado al
// lado. Cuando no hay pack, mostrar el precio a pagar con contexto claro.
// ─────────────────────────────────────────────────────────────────────────

// ¿El pack cubre este lavado? True sólo cuando hay un pack seleccionado Y el
// backend confirmó orderAmount === 0. La segunda condición evita mostrar
// "gratis" durante el flash de pre-resolución (calPrice todavía no volvió).
const isFreeWithPack = computed(
  () => !!selectedCard.value && orderAmount.value === 0
);

// Precio "de lista" del plan seleccionado, sin pack aplicado. Se usa como
// número tachado al lado del $0 → efecto "ganaste" (mismo truco de MELI con
// "envío gratis"). En centavos, como todo lo demás.
const retailPrice = computed(() => Number(selectedPlan.value?.price) || 0);

// Texto del CTA — cambia según el estado para reforzar el commitment:
//   - Pack cubre → "Iniciar lavado — Gratis"
//   - Pagando → "Pagar $X e iniciar" (el precio en la CTA es el commitment)
const ctaLabel = computed(() => {
  if (!canWash.value) return t("routes.washer.submit");
  if (isFreeWithPack.value) return t("routes.washer.submitFree");
  if (orderAmount.value > 0)
    return t("routes.washer.submitPay", { price: formatPrice(orderAmount.value) });
  return t("routes.washer.submit");
});

// 监听错误
watch(washerError, (err) => {
  if (unref(err)) {
    showToast(unref(err));
  }
});

// 监听加载状态
watch(isFetching, (loading) => {
  isLoading.value = loading;
});

// 计算订单金额
const calculatePrice = async () => {
  if (!selectedPlan.value?.mark) {
    orderAmount.value = 0;
    return;
  }

  const { data, error } = await washApi.calPrice({
    iotId: id,
    mark: selectedPlan.value?.mark,
    vipCardId: selectedCard.value?.cardId,
  });

  if (unref(error)) {
    showToast(t("routes.errors.networkError"));
    return 0;
  }

  orderAmount.value = data.value.price;
};

// 创建订单
const createOrder = async () => {
  // Bloquear si la máquina no está disponible (mantenimiento / en uso)
  const status = washerData.value?.iotStatus;
  if (status === IOT_STATUS.MAINTENANCE) {
    showToast(t("routes.washer.unavailable.maintenance"));
    return;
  }
  if (status === IOT_STATUS.IN_USE) {
    showToast(t("routes.washer.unavailable.inUse"));
    return;
  }

  // Guard anti-doble-pago: hay un pack válido para este lavado pero el usuario
  // no lo seleccionó → preguntamos antes de mandarlo a pagar con plata.
  if (!selectedCard.value && applicableCard.value) {
    try {
      await showDialog({
        title: t("routes.washer.usePackDialog.title"),
        message: t("routes.washer.usePackDialog.message", {
          price: formatPrice(orderAmount.value),
        }),
        showCancelButton: true,
        confirmButtonText: t("routes.washer.usePackDialog.usePack"),
        cancelButtonText: t("routes.washer.usePackDialog.payAnyway"),
      });
      // Confirmó usar el pack → lo aplicamos y seguimos: la orden sale $0.
      selectedCard.value = applicableCard.value;
    } catch {
      // Canceló → paga con plata, seguimos sin tarjeta.
    }
  }

  const { data, error } = await washApi.newOrder({
    iotId: id,
    mark: selectedPlan.value?.mark,
    vipCardId: selectedCard.value?.cardId,
  });

  if (unref(error)) {
    showToast(unref(error) || t("routes.errors.networkError"));
    return;
  }

  // 跳转支付页面
  const { price, balance, timeout, orderId: oid } = data.value;

  // TODO: 优化, 统一到支付页面处理
  if (price > 0) {
    router.push({
      path: "/order/payment",
      query: {
        oid,
        price,
        balance,
        timeout,
        // Sin este `from`, la pantalla de resultado no reconoce la orden de
        // lavado y el "Redirigiendo" queda colgado sin destino.
        from: PAYMENT_FROM.WASH_ORDER,
      },
    });

    return;
  }
  const { data: balanceData, error: balanceError } = await washApi.balancePay(oid)
  if (unref(balanceError)) {
    showToast(unref(balanceError));
    return;
  }
  // from: WASH_ORDER (antes PAYMENT_FROM.WASHER, que no existía → undefined y
  // dejaba la pantalla de resultado sin acción de redirección).
  success({ oid, from: PAYMENT_FROM.WASH_ORDER, method: PAYMENT_METHOD.BALANCE });
};

// 监听方案选择
watch(
  [selectedCard, washPlans],
  () => {
    calculatePrice();
  },
  { immediate: true, deep: true }
);

// Al elegir/cambiar de plan, auto-vinculamos el pack: si hay una tarjeta VIP
// válida para ese plan la usamos (total $0); si no, limpiamos la anterior (una
// tarjeta no sirve para otro plan). Nada se consume hasta "Iniciar lavado".
watch(
  selectedPlan,
  (plan) => {
    if (!plan) return;
    const match = vipCards.value.find((c) => c.mark === plan.mark) || null;
    if ((selectedCard.value?.cardId ?? null) !== (match?.cardId ?? null)) {
      selectedCard.value = match; // dispara recalc vía el watcher de selectedCard
    } else {
      calculatePrice();
    }
  },
  { immediate: true, deep: true }
);

// Preselección al cargar los planes:
//  - Si hay un pack (VIP) válido para algún plan de esta máquina, elegimos ese
//    plan → el pack se auto-usa (total $0), que es lo que quiere el founder.
//  - Si no, "Lavado con Cera" (premium) por defecto, o el de mayor precio.
watch(
  washPlans,
  (plans) => {
    if (!plans.length || selectedPlan.value) return;
    const planWithPack = vipCards.value.length
      ? plans.find((p) => vipCards.value.some((c) => c.mark === p.mark))
      : null;
    selectedPlan.value =
      planWithPack ||
      plans.find((p) => /premium/i.test(p.name)) ||
      [...plans].sort((a, b) => b.price - a.price)[0];
  },
  { immediate: true }
);
</script>

<template>
  <div class="bg-ink min-h-screen pb-safe-bottom">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="absolute inset-0 flex-center bg-ink/80">
      <van-loading size="24px" vertical>{{ t("common.loading") }}</van-loading>
    </div>

    <!-- 错误提示 -->
    <van-empty
      v-if="error"
      :description="error"
      class="absolute inset-0 flex-center bg-ink"
    >
      <template #image>
        <van-icon name="warning-o" size="48" class="text-text-dim" />
      </template>
    </van-empty>

    <!-- Header compacto: el usuario acaba de escanear el QR, ya sabe dónde
         está y qué máquina eligió. Solo confirmamos identidad de la máquina
         (por si un QR estuviera mal pegado) y su estado en una línea. Los
         bloques de "Sucursal / Dirección" y "Ventajas" se sacaron: nadie los
         lee cuando está con el auto al lado esperando arrancar. Las
         "Ventajas" viven mejor en el detalle de sucursal (/store/{id}). -->
    <div class="px-4 py-3">
      <div class="washer-header">
        <h2 class="washer-header__name">{{ washerData?.name }}</h2>
        <status-tag
          v-if="[0, 1, 2].includes(washerData?.iotStatus)"
          :status="washerData?.iotStatus"
        />
      </div>
    </div>

    <!-- Selector de plan — oculto cuando la máquina tiene un único plan
         (no hay nada que elegir; el nombre ya está en el header y el precio
         en la banda de costo de abajo). Aparece cuando hay 2+ planes reales
         donde el usuario sí decide entre opciones (ej: Simple vs Premium). -->
    <div v-if="washPlans.length > 1" class="px-4 py-3">
      <div class="text-32 fw-bold text-text-primary font-display mb-30 text-center">
        {{ t("routes.washer.selectPlan") }}
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="item in washPlans"
          :key="item.mark"
          class="plan-card"
          :class="{
            'plan-card--selected': selectedPlan?.mark === item.mark,
            'plan-card--full': washPlans.length === 1,
          }"
          @click="selectedPlan = item"
        >
          <div class="plan-card__name">
            <span class="block">{{ splitPlanName(item.name).first }}</span>
            <span class="block" v-if="splitPlanName(item.name).rest">{{ splitPlanName(item.name).rest }}</span>
          </div>
          <price-tag
            :price="item.price"
            :thousands="true"
            :decimals="0"
            currency-class="text-lg text-primary"
            integer-class="text-3xl font-bold text-primary"
          />
        </div>
      </div>
    </div>

    <!-- ─────────────────────────────────────────────────────────────────
         Banda de costo — reemplaza al viejo "Total: $X" del action-bar y a la
         pack-row chiquita. Es EL bloque visual protagonista de la pantalla:
         cuando el pack cubre, grita "$0 gratis" con el precio tachado; cuando
         hay que pagar, muestra el total con contexto claro.
         ───────────────────────────────────────────────────────────────── -->

    <!-- Caso A: pack cubre el lavado — banda verde protagonista -->
    <div v-if="isFreeWithPack" class="px-4 py-3">
      <div class="cost-band cost-band--free" @click="showVipCards = true">
        <div class="cost-band__eyebrow">
          <van-icon name="passed" size="14" class="cost-band__check" />
          {{ t("routes.washer.cost.freeEyebrow") }}
        </div>
        <div class="cost-band__price-row">
          <span class="cost-band__price">$0</span>
          <span v-if="retailPrice > 0" class="cost-band__retail">
            {{ formatPrice(retailPrice) }}
          </span>
        </div>
        <div class="cost-band__sub">
          {{ t("routes.washer.cost.freeSub", { count: selectedCard.remainWashCount }) }}
          <span class="cost-band__change">{{ t("routes.washer.vipCard.change") }}</span>
        </div>
      </div>
    </div>

    <!-- Caso B: hay pack aplicable pero el usuario lo sacó — nudge cyan -->
    <div v-else-if="applicableCard" class="px-4 py-3">
      <div class="cost-band cost-band--available" @click="showVipCards = true">
        <div class="cost-band__eyebrow cost-band__eyebrow--cyan">
          <van-icon name="vip-card-o" size="14" />
          {{ t("routes.washer.cost.availableEyebrow") }}
        </div>
        <div class="cost-band__price-row">
          <span class="cost-band__price cost-band__price--pay">
            {{ formatPrice(orderAmount) }}
          </span>
        </div>
        <div class="cost-band__sub">
          {{ t("routes.washer.cost.availableSub", { count: applicableCard.remainWashCount }) }}
          <span class="cost-band__change">{{ t("routes.washer.vipCard.use") }}</span>
        </div>
      </div>
    </div>

    <!-- Caso C: sin pack aplicable — card neutra con total a pagar -->
    <div v-else-if="orderAmount > 0" class="px-4 py-3">
      <div class="cost-band cost-band--pay">
        <div class="cost-band__eyebrow">
          {{ t("routes.washer.cost.payEyebrow") }}
        </div>
        <div class="cost-band__price-row">
          <span class="cost-band__price cost-band__price--pay">
            {{ formatPrice(orderAmount) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Oferta de pago en efectivo (destacada).
         Oculta hasta confirmar % de descuento y disponibilidad real.
         Flipear SHOW_CASH_OFFER a true cuando esté definido. -->
    <div v-if="SHOW_CASH_OFFER" class="px-4 py-3">
      <div class="cash-offer flex items-center gap-3 rounded-2xl px-5 py-4">
        <span class="cash-offer__peso shrink-0">$</span>
        <div class="flex-1">
          <div class="text-30 fw-bold text-white">
            {{ t("routes.washer.cashOffer.title") }}
          </div>
          <div class="text-24 text-white/90 mt-1">
            {{ t("routes.washer.cashOffer.subtitle") }}
          </div>
        </div>
      </div>
    </div>

    <!-- Checklist "Antes de iniciar" — solo lo mínimo que el usuario tiene
         que hacer ANTES de apretar el botón (2 ítems que se leen en 3s).
         Los pasos DURANTE el lavado (avanzar lento, hasta topes, apagar motor)
         viven en /order/{id} cuando washStatus === 2, así aparecen cuando
         realmente hay que ejecutarlos. -->
    <div class="px-4 py-3">
      <div class="prewash-checklist">
        <div class="prewash-checklist__title">
          {{ t("routes.washer.prewash.title") }}
        </div>
        <ul class="prewash-checklist__list">
          <li class="prewash-checklist__item">
            <van-icon name="checked" class="prewash-checklist__icon" />
            <span>{{ t("routes.washer.prewash.windows") }}</span>
          </li>
          <li class="prewash-checklist__item">
            <van-icon name="checked" class="prewash-checklist__icon" />
            <span>{{ t("routes.washer.prewash.wipers") }}</span>
          </li>
          <li class="prewash-checklist__item">
            <van-icon name="checked" class="prewash-checklist__icon" />
            <span>{{ t("routes.washer.prewash.enter") }}</span>
          </li>
          <li class="prewash-checklist__item">
            <van-icon name="checked" class="prewash-checklist__icon" />
            <span>{{ t("routes.washer.prewash.center") }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Antes había un botón "Emergencia" acá, pero esta pantalla es la de
         ELECCIÓN previa al inicio del lavado — el auto todavía está afuera,
         no hay emergencia posible. El botón vive en /payment/result y en
         /order/{id} (con washStatus 2/3/4), que es cuando el auto está
         realmente adentro. Ver src/constants/contact.js y CHANGELOG. -->

    <!-- Action-bar: 100% CTA full-width. El precio ya está grande en la banda
         de costo de arriba; duplicarlo acá era ruido. El texto del botón
         cambia según el estado ("Iniciar lavado — Gratis" / "Pagar $X e
         iniciar" / "Iniciar lavado") para que el commitment sea explícito. -->
    <van-action-bar class="wash-action-bar">
      <van-action-bar-button
        class="wash-action-bar__cta"
        :type="isFreeWithPack ? 'success' : 'danger'"
        :disabled="!canWash"
        :text="ctaLabel"
        @click="createOrder"
      />
    </van-action-bar>

    <!-- VIP卡选择弹窗 -->
    <vip-card-selector
      v-model:show="showVipCards"
      v-model:selectedCard="selectedCard"
      :list="vipCards"
      :wash-plans="washPlans"
      :mark="selectedPlan?.mark"
    />

  </div>
</template>

<style scoped>
/* Header compacto: nombre de la máquina + badge de estado en una sola fila,
   sin marco de card. El usuario escaneó el QR y ya está frente a ella;
   solo confirmamos identidad. Los datos de sucursal/dirección que estaban
   antes son ruido en este momento (nadie los mira). */
.washer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 4px;
}

.washer-header__name {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.15;
  margin: 0;
}

/* Checklist "Antes de iniciar" — bloque chiquito y directo. NO cyan/verde
   saturado para no competir con la cost-band de arriba (que es la que grita).
   Estilo utility, tipo "info-tip", con ícono verde para reforzar acción OK. */
.prewash-checklist {
  padding: 12px 16px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line-color);
}

.prewash-checklist__title {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.prewash-checklist__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.prewash-checklist__item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  line-height: 1.35;
  color: var(--text-primary);
}

.prewash-checklist__icon {
  color: var(--brand-success);
  font-size: 16px;
  flex-shrink: 0;
}

/* Action-bar del CTA principal — grande, imposible de no ver. Es LA acción
   de la pantalla; el default de Vant (44px) queda chico contra el resto
   de contenido. Subimos alto + tipografía + un pelín de shadow para
   levantarlo del fondo. */
.wash-action-bar {
  --van-action-bar-height: 76px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: var(--surface-color);
  border-top: 1px solid var(--line-color);
}

.wash-action-bar__cta.van-button {
  height: 56px;
  border-radius: 999px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.01em;
  box-shadow: 0 8px 22px -10px rgba(0, 0, 0, 0.6);
}

/* Sombra específica según el tipo (verde/rojo) para que se sienta "vivo". */
.wash-action-bar__cta.van-button--success {
  box-shadow: 0 8px 22px -10px rgba(var(--brand-success-rgb), 0.7);
}

.wash-action-bar__cta.van-button--danger {
  box-shadow: 0 8px 22px -10px rgba(240, 68, 56, 0.6);
}

/* Tarjetas de plan de lavado */
.plan-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  min-height: 168px;
  padding: 20px 14px 16px;
  text-align: center;
  border-radius: 16px;
  background: var(--surface-color);
  border: 2px solid var(--line-color);
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.plan-card:active {
  transform: scale(0.98);
}

.plan-card--selected {
  border-color: var(--primary-color);
  background: rgba(0, 187, 252, 0.08);
  box-shadow: 0 0 0 1px var(--primary-color), 0 14px 30px -18px rgba(0, 187, 252, 0.5);
}

.plan-card__name {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.12;
  color: var(--text-primary);
}

/* Plan único: ocupa todo el ancho, layout horizontal (nombre + precio) */
.plan-card--full {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 0;
  padding: 18px 22px;
  text-align: left;
}

.plan-card--full .plan-card__name {
  font-size: 20px;
}

/* ─────────────────────────────────────────────────────────────────────
   Banda de costo (protagonista de la pantalla). Reemplaza el viejo bloque
   pack-row y el "Total: $X" del action-bar. Tres variantes según estado:
     --free       (verde, protagonista, con precio tachado): pack cubre todo
     --available  (cyan, nudge): hay pack pero el usuario lo sacó
     --pay        (neutro, informativo): sin pack, paga con saldo/MP
   ───────────────────────────────────────────────────────────────────── */
.cost-band {
  padding: 18px 20px 16px;
  border-radius: 18px;
  cursor: pointer;
  transition: transform 0.2s;
}

.cost-band:active {
  transform: scale(0.99);
}

/* Estado FREE — el hero del rediseño. Verde saturado, glow, para que se
   vea desde 2 metros de distancia que el lavado es gratis. */
.cost-band--free {
  background:
    radial-gradient(120% 130% at 50% 0%, rgba(var(--brand-success-rgb), 0.22) 0%, transparent 60%),
    rgba(var(--brand-success-rgb), 0.10);
  border: 1px solid rgba(var(--brand-success-rgb), 0.55);
  box-shadow:
    0 0 32px rgba(var(--brand-success-rgb), 0.18),
    0 12px 30px -18px rgba(0, 0, 0, 0.85);
}

.cost-band--available {
  background:
    radial-gradient(120% 130% at 50% 0%, rgba(0, 187, 252, 0.15) 0%, transparent 60%),
    rgba(0, 187, 252, 0.08);
  border: 1px solid rgba(0, 187, 252, 0.5);
}

.cost-band--pay {
  background: var(--surface-color);
  border: 1px solid var(--line-color);
  cursor: default;
}

.cost-band--pay:active {
  transform: none;
}

/* Eyebrow (líneita chica arriba del precio) */
.cost-band__eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-success);
  margin-bottom: 8px;
}

.cost-band__eyebrow--cyan {
  color: var(--primary-color);
}

.cost-band--pay .cost-band__eyebrow {
  color: var(--text-secondary);
}

.cost-band__check {
  color: var(--brand-success);
}

/* Precio (el protagonista visual) */
.cost-band__price-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  line-height: 1;
}

.cost-band__price {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
  line-height: 1;
}

/* Cuando hay que pagar, el precio es un pelín menos gigante — informativo,
   no eufórico como el $0 gratis. */
.cost-band__price--pay {
  font-size: 38px;
  color: var(--text-primary);
}

/* Precio de lista tachado al lado del $0 — "ganaste $25.000" */
.cost-band__retail {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: line-through;
  text-decoration-color: rgba(255, 255, 255, 0.35);
  letter-spacing: -0.01em;
}

/* Sub (line-height 1.35, texto secundario debajo del precio) */
.cost-band__sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.35;
}

.cost-band__change {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--primary-color);
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.cost-band--free .cost-band__change {
  color: var(--brand-success);
}

.cash-offer {
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-light) 100%);
  box-shadow: 0 8px 20px -8px rgba(var(--accent-color-rgb), 0.6);
}

.cash-offer__peso {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  border: 2px solid rgba(255, 255, 255, 0.55);
}

:deep(.van-empty__description) {
  padding: 0;
}

.top-up-cell :deep(.van-cell__title) {
  flex: auto;
}

.skew {
  position: relative;
  width: max-content;
  height: 54px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skew::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 10px;
  background: orange;
  transform: skewX(-15deg);
}

.skew::before {
  content: "";
  position: absolute;
  top: 0;
  right: -20px;
  width: 100%;
  height: 54px;
  border-radius: 10px;
  background: orange;
}

.skew-content {
  z-index: 1;
  transform: translateX(10px);
}
</style>

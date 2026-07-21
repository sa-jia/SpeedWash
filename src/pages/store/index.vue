<script setup>
import { getImageUrl } from "@/utils";
import { PRE_LAUNCH } from "@/constants";
import { washApi } from "@/api";
import IconNav from "@/assets/store/icon_nav.png";
import DefaultBanner from "@/assets/store/store-banner-default.png";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const { coords, locatedAt, error, resume, pause } = useGeolocation();

// 获取店铺详情
const { data } = storeApi.detail(route.params.id);

// Orden físico real: al entrar al lavadero, la máquina Sin Contacto queda a la
// izquierda y la de Rodillos a la derecha. La API no garantiza el orden, así que
// lo forzamos poniendo Sin Contacto (touchless) primero.
const isTouchless = (m) => /sin\s*contacto|touchless/i.test(m?.name || "");

// Workaround del backend: storeApi.detail devuelve `iotList` con `iotId`,
// `name` y `lowestPrice`, PERO NO `iotStatus` (schema StoreIot). El estado
// solo lo devuelve washApi.iotInfo(iotId). Para poder mostrar
// Disponible/En uso/Mantenimiento antes de que el usuario entre a la máquina,
// hacemos N llamadas paralelas — una por máquina — y mergeamos el estado.
// Barato para 2-4 máquinas; si mañana escala a N sucursales grandes hay que
// exigirle al proveedor que agregue iotStatus a StoreIot. Ver CHANGELOG 2.10.
const machineStatuses = ref({}); // { [iotId]: iotStatus }
// `statusesLoaded` gatea el render de las cards: mientras las llamadas
// paralelas están en vuelo mostramos un skeleton, no las cards con estado
// ambiguo. Evita el flash "Más información" → "Lavar" y "sin badge" → "Disponible".
const statusesLoaded = ref(false);
// Usamos `watch` en la lista de IDs (string estable) en vez de watchEffect,
// para NO re-disparar cuando escribimos machineStatuses.value (loop infinito).
const iotIdsKey = computed(() =>
  (data.value?.iotList || []).map((m) => m.iotId).join(",")
);
watch(iotIdsKey, async (key) => {
  if (!key) return;
  statusesLoaded.value = false;
  const list = data.value?.iotList || [];
  const results = await Promise.all(
    list.map(async (m) => {
      // El composable devuelve `.json()` como promise; hay que awaitarla.
      const { data: infoData, error: infoErr } = await washApi.iotInfo(m.iotId);
      if (unref(infoErr)) return [m.iotId, undefined];
      return [m.iotId, unref(infoData)?.iotStatus];
    })
  );
  machineStatuses.value = Object.fromEntries(results);
  statusesLoaded.value = true;
}, { immediate: true });

const orderedMachines = computed(() =>
  [...(data.value?.iotList || [])]
    .map((m) => ({ ...m, iotStatus: machineStatuses.value[m.iotId] }))
    .sort((a, b) => Number(isTouchless(b)) - Number(isTouchless(a)))
);

// Badge de estado: en pre-apertura mostramos "Próximamente" en vez del estado
// real del backend (ver PRE_LAUNCH).
const badgeState = computed(() =>
  PRE_LAUNCH ? "soon" : Number(data.value?.opening) === 1 ? "open" : "closed"
);
const statusLabel = computed(() =>
  PRE_LAUNCH
    ? t("routes.store.status.soon")
    : t(`routes.store.status.${Number(data.value?.opening)}`)
);

const { distanceFormatted } = useLocation(computed(() => ({
  lat1: coords.value?.latitude,
  lon1: coords.value?.longitude,
  lat2: data.value?.lat,
  lon2: data.value?.lng,
})));

// Banner de la sucursal — usamos siempre el render de marca
// (el backend devuelve un logo recortado que se ve mal).
const storePicture = computed(() => DefaultBanner);

// 处理导航
const handleNavigate = () => {
  // showToast("导航功能开发中");
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${data.value.lat},${data.value.lng}`
  );
};

// 处理扫码洗车
const handleScan = () => {
  router.push('/scan');
};

// 处理购买VIP卡
const handleBuyVip = () => {
  router.push("/vip");
};
</script>

<template>
  <div class="py-4 flex flex-col gap-lg bottom-tabbar-40 pb-100px">
    <!-- 店铺封面图 -->
    <div class="store-cover">
      <van-image
        :src="storePicture"
        class="store-cover__img"
        fit="cover"
        :alt="t('routes.store.detail.coverImage')"
      >
        <template v-slot:loading>
          <van-loading type="spinner" size="20" />
        </template>
      </van-image>
    </div>

    <!-- 店铺信息 -->
    <van-cell-group inset :border="false">
      <van-cell>
        <template #title>
          <div class="flex items-center gap-2">
            <span class="text-3xl font-medium">{{ data?.storeName }}</span>
            <div
              class="status-badge"
              :class="`status-badge--${badgeState}`"
            >
              <span class="status-badge__dot"></span>
              {{ statusLabel }}
            </div>
          </div>
        </template>
      </van-cell>

      <van-cell center>
        <template #title>
          <div class="text-28 text-text-primary">{{ data?.address }}</div>
          <div class="text-24 text-text-secondary mt-1">{{ distanceFormatted }}</div>
        </template>
        <template #value>
          <van-button
            size="small"
            round
            class="nav-btn"
            :icon="IconNav"
            @click="handleNavigate"
          >
            {{ t('routes.store.detail.navigation') }}
          </van-button>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- Comprar Pack -->
    <div class="px-4">
      <div class="buy-pack" @click="handleBuyVip">
        <div class="buy-pack__icon">
          <van-icon name="award-o" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="buy-pack__title">{{ t("routes.store.detail.buyVip") }}</div>
          <div class="buy-pack__sub">Ahorrá con lavados prepagos</div>
        </div>
        <van-icon name="arrow" class="buy-pack__arrow" />
      </div>
    </div>

    <!-- Lista de máquinas — mostramos skeleton mientras cargan las llamadas
         paralelas a washApi.iotInfo (workaround del backend, ver arriba). Al
         mostrar cards SIN estado y después re-pintarlas con badge/etiqueta,
         el usuario ve un flash confuso. Con el skeleton la pantalla dice
         claramente "esto se está cargando". -->
    <div v-if="orderedMachines.length" class="grid grid-cols-2 gap-3 px-4">
      <template v-if="statusesLoaded">
        <machine-item
          v-for="machine in orderedMachines"
          :key="machine.iotId"
          :machine="machine"
        />
      </template>
      <template v-else>
        <div
          v-for="machine in orderedMachines"
          :key="machine.iotId"
          class="machine-skeleton"
        >
          <div class="machine-skeleton__art"></div>
          <div class="machine-skeleton__title"></div>
          <div class="machine-skeleton__btn"></div>
        </div>
      </template>
    </div>

    <!-- 店铺介绍 -->
    <van-cell-group v-if="data?.description" inset :border="false">
      <van-cell :title="t('routes.store.detail.introduction')" />
      <van-cell>
        <div class="text-2xl font-medium w-full text-left">
          {{ data?.description }}
        </div>
      </van-cell>
    </van-cell-group>

    <van-action-bar v-if="false">
      <van-action-bar-button
        type="primary"
        @click="handleScan"
      >
        {{ t("routes.store.detail.scanToWash") }}
      </van-action-bar-button>
    </van-action-bar>
  </div>
</template>

<style scoped>
/* Portada de la sucursal: full-width con el ratio del render ya recortado
   (646x340, sin la franja blanca inferior) para que no quede espacio muerto. */
.store-cover {
  margin: 0 16px;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 646 / 340;
  background: #000;
}

.store-cover__img {
  width: 100%;
  height: 100%;
  display: block;
}

:deep(.van-nav-bar) {
  background-color: transparent;
}

:deep(.van-nav-bar__content) {
  background-color: transparent;
}

:deep(.van-button--primary) {
  background-color: #00BBFC;
  border-color: #00BBFC;
}

.nav-btn {
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.08);
  white-space: nowrap;
  font-weight: 500;
}

/* Botón Comprar Pack */
.buy-pack {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 16px;
  cursor: pointer;
  background:
    radial-gradient(140% 120% at 100% 0%, rgba(255, 148, 22, 0.16) 0%, transparent 55%),
    var(--surface-color);
  border: 1px solid rgba(255, 148, 22, 0.45);
  box-shadow: 0 10px 28px -16px rgba(255, 148, 22, 0.6);
  transition: transform 0.2s, border-color 0.2s;
}

.buy-pack:active {
  transform: scale(0.98);
}

.buy-pack__icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-light) 100%);
  box-shadow: 0 6px 16px -6px rgba(255, 148, 22, 0.7);
}

.buy-pack__title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.buy-pack__sub {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.buy-pack__arrow {
  color: var(--accent-color);
  font-size: 18px;
  flex-shrink: 0;
}

/* Skeleton de card de máquina — se muestra mientras las llamadas paralelas
   a washApi.iotInfo aún no resolvieron. Match aproximado del tamaño de
   machine-item para evitar layout shift al pintar la card real. */
.machine-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 12px 12px;
  border-radius: 18px;
  background: var(--surface-color);
  border: 1px solid var(--line-color);
  min-height: 168px;
}

.machine-skeleton__art,
.machine-skeleton__title,
.machine-skeleton__btn {
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.09) 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

.machine-skeleton__art {
  height: 78px;
}

.machine-skeleton__title {
  height: 18px;
  width: 70%;
  margin: 6px auto 0;
}

.machine-skeleton__btn {
  height: 34px;
  border-radius: 999px;
  margin-top: auto;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .machine-skeleton__art,
  .machine-skeleton__title,
  .machine-skeleton__btn {
    animation: none;
  }
}

/* Badge de estado */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 4px 11px 4px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1;
}

.status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-badge--open {
  color: var(--brand-success);
  background: rgba(var(--brand-success-rgb), 0.12);
  border: 1px solid rgba(var(--brand-success-rgb), 0.32);
}

.status-badge--open .status-badge__dot {
  background: var(--brand-success);
  animation: badge-pulse 2s ease-in-out infinite;
}

.status-badge--closed {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line-color);
}

.status-badge--closed .status-badge__dot {
  background: var(--text-dim);
}

/* Pre-apertura: ámbar, sin pulso (no invita a ir todavía) */
.status-badge--soon {
  color: #FF9416;
  background: rgba(255, 148, 22, 0.12);
  border: 1px solid rgba(255, 148, 22, 0.35);
}

.status-badge--soon .status-badge__dot {
  background: #FF9416;
}

@keyframes badge-pulse {
  0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55); }
  70% { box-shadow: 0 0 0 5px rgba(52, 211, 153, 0); }
  100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .status-badge--open .status-badge__dot { animation: none; }
}
</style>

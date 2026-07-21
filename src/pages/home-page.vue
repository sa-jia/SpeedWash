<script setup>
import { indexApi, vipCardApi } from "@/api";
import { getImageUrl } from "@/utils";
import { PRE_LAUNCH } from "@/constants";
import { useFounderStatus } from "@/composables/useFounderStatus";
import logoUrl from "@/assets/speedwash-wordmark.png";

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();

// Detección de fundador (ver composables/useFounderStatus.js). Cambia el
// bloque de "Packs de lavado" a la variante dorada "Sos socio fundador"
// con copy de renovación de beneficio.
const { isFounder } = useFounderStatus();

// Banner
const { data: banners } = indexApi.banner();

// Mi pack — le da al que ya compró una puerta directa en la home (ver lavados
// restantes / vincular patente), en vez de enterrarla en Mi cuenta.
// canUseType: 1 = abonos activos.
//
// IMPORTANTE: la home es pública. myCardList (/user/vipCard/*) es un endpoint
// estricto: sin token válido devuelve 999 y el factory hace redirect global a
// /login. Por eso gateamos con getToken() —el token que realmente viaja en la
// request (userInfo.token)— y NO con isRegistered (que mira otro storage y
// puede estar desincronizado). Si no hay sesión real, no llamamos y la home
// nunca patea a login.
const myCards = ref([]);
if (userStore.getToken()) {
  const { data: cardData } = vipCardApi.myCardList({ canUseType: 1 });
  watchEffect(() => {
    myCards.value = Array.isArray(unref(cardData)) ? unref(cardData) : [];
  });
}

const hasPack = computed(() => myCards.value.length > 0);
const packCount = computed(() => myCards.value.length);
const totalWashes = computed(() =>
  myCards.value.reduce((sum, c) => sum + (Number(c.remainWashCount) || 0), 0)
);

// Un usuario puede tener varios abonos, cada uno con su patente. Regla de
// correctitud: NO mostramos "todo listo" si algún abono sigue sin patente.
// unboundCount = abonos sin patente; boundPlates = patentes distintas ya
// vinculadas (Set, por si dos abonos comparten el mismo auto).
const unboundCount = computed(() => myCards.value.filter((c) => !c.licenseNo).length);
const needsPlate = computed(() => unboundCount.value > 0);
const boundPlates = computed(() => [
  ...new Set(myCards.value.map((c) => c.licenseNo).filter(Boolean)),
]);

const packTitle = computed(() =>
  packCount.value > 1 ? t("routes.home.myPack.titleMany") : t("routes.home.myPack.title")
);
const washesLabel = computed(() =>
  totalWashes.value === 1
    ? t("routes.home.myPack.countOne")
    : t("routes.home.myPack.count", { n: totalWashes.value })
);
const plateTitle = computed(() => {
  if (needsPlate.value) return t("routes.home.myPack.plateEmptyTitle");
  return boundPlates.value.length > 1
    ? t("routes.home.myPack.platesLinkedTitle")
    : t("routes.home.myPack.plateLinkedTitle", { plate: boundPlates.value[0] });
});
const plateSub = computed(() =>
  needsPlate.value
    ? t("routes.home.myPack.plateEmptySub")
    : t("routes.home.myPack.plateLinkedSub")
);
const ctaLabel = computed(() => {
  if (needsPlate.value) return t("routes.home.myPack.ctaBindPlate");
  return packCount.value > 1
    ? t("routes.home.myPack.ctaViewPreLaunchMany")
    : t("routes.home.myPack.ctaViewPreLaunch");
});

// Si hay UN solo abono sin patente, abrimos directo la hoja de vincular; si hay
// varios sin patente (o ya están todos vinculados), vamos a la lista de abonos.
function goToMyPack() {
  const openBind = needsPlate.value && unboundCount.value === 1;
  router.push(openBind ? "/vouchers?bind=1" : "/vouchers");
}

// Shops. isFinished evita el "flash" del fallback hardcodeado mientras
// la API responde: solo lo mostramos si la request terminó sin datos.
const { data: shops, isFinished: shopsLoaded } = indexApi.storeList();

// Ongoing order check
const { data: orderData } = indexApi.checkWashingOrder();
const hasOngoingOrder = computed(() => !!unref(orderData)?.orderId);
const ongoingOrderId = computed(() => unref(orderData)?.orderId);

const viewOrder = () => {
  if (ongoingOrderId.value) {
    router.push(`/order/${ongoingOrderId.value}`);
  }
};

function viewShop(id) {
  router.push({ name: "StoreDetail", params: { id } });
}
</script>

<template>
  <div class="home-container">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <img :src="logoUrl" alt="SpeedWash" class="hero-logo" />
        <p class="hero-subtitle"><strong>{{ t('routes.home.hero.tagline') }}</strong></p>
        <p class="hero-microbanner">{{ t('routes.home.hero.microbanner') }}</p>
      </div>
    </div>

    <!-- Scan Button - CTA Principal -->
    <div class="px-4 relative z-10" style="margin-top: 10px">
      <div class="scan-cta" @click="router.push('/scan')">
        <div class="scan-cta__icon">
          <van-icon name="scan" size="32" color="#fff" />
        </div>
        <div class="scan-cta__text">
          <span class="scan-cta__title">{{ t("routes.home.scanButton.title") }}</span>
          <span class="scan-cta__subtitle">{{ t("routes.home.scanButton.subtitle") }}</span>
        </div>
        <van-icon name="arrow" color="rgba(255,255,255,0.7)" size="20" />
      </div>
    </div>

    <!-- Banner Carousel -->
    <div class="px-4 mt-4" v-if="banners?.length">
      <van-swipe class="banner-swipe" :autoplay="3000" indicator-color="#00BBFC" :show-indicators="banners?.length > 1">
        <van-swipe-item v-for="banner in banners" :key="banner.name">
          <van-image :src="getImageUrl(banner.picUrl)" class="w-full banner-img" fit="cover" :alt="banner.name" radius="12" />
        </van-swipe-item>
      </van-swipe>
    </div>

    <!-- Mi pack (usuario con sesión real y abono activo) -->
    <div v-if="hasPack" class="px-4 mt-4">
      <div class="mypack-card">
        <div class="mypack-card__head">
          <div class="mypack-card__icon">
            <van-icon name="vip-card-o" size="24" color="#fff" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="mypack-card__title">{{ packTitle }}</h3>
            <p class="mypack-card__count">{{ washesLabel }}</p>
          </div>
        </div>

        <div class="mypack-card__plate" :class="{ 'mypack-card__plate--ready': !needsPlate }">
          <van-icon :name="needsPlate ? 'info-o' : 'passed'" size="18" />
          <div class="mypack-card__plate-text">
            <span class="mypack-card__plate-title">{{ plateTitle }}</span>
            <span class="mypack-card__plate-sub">{{ plateSub }}</span>
          </div>
        </div>

        <button class="mypack-card__cta" type="button" @click="goToMyPack">
          <van-icon :name="needsPlate ? 'orders-o' : 'balance-o'" size="17" />
          {{ ctaLabel }}
        </button>
      </div>
    </div>

    <!-- ─────────────────────────────────────────────────────────────────
         Bloque "Packs de lavado" — 3 variantes según status del usuario:
           - Fundador → variante dorada "Sos socio fundador" (siempre visible
             según decisión B: querés que renueve antes de octubre).
           - Usuario sin pack (no fundador) → variante naranja "Comprá tu
             pack" con la promo de la patente.
           - Usuario CON pack activo (no fundador) → bloque oculto (ya tiene
             lo que comprar; el bloque "Mi pack" de arriba lo cubre).
         ───────────────────────────────────────────────────────────────── -->

    <!-- Variante fundador -->
    <div v-if="isFounder" class="service-cards-section px-4">
      <div class="pack-card pack-card--founder" @click="router.push('/vip')">
        <div class="pack-card__glow pack-card__glow--founder"></div>
        <div class="pack-card__head">
          <div class="pack-card__icon pack-card__icon--founder">
            <van-icon name="award" size="24" color="#fff" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="pack-card__title">{{ t("routes.home.founder.title") }}</h3>
            <p class="pack-card__desc">{{ t("routes.home.founder.subtitle") }}</p>
          </div>
        </div>
        <div class="pack-card__action pack-card__action--founder">
          {{ t("routes.home.founder.cta") }}
          <van-icon name="arrow" size="13" />
        </div>
      </div>
    </div>

    <!-- Variante no-fundador, sin pack activo -->
    <div v-else-if="!hasPack" class="service-cards-section px-4">
      <div class="pack-card" @click="router.push('/vip')">
        <div class="pack-card__glow"></div>
        <div class="pack-card__head">
          <div class="pack-card__icon">
            <van-icon name="award-o" size="24" color="#fff" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="pack-card__title">{{ t("routes.home.vip.title") }}</h3>
            <p class="pack-card__desc">{{ t("routes.home.vip.subtitle") }}</p>
          </div>
        </div>

        <div class="pack-card__feature">
          <van-icon name="scan" size="16" />
          <div class="pack-card__feature-text">
            <span class="pack-card__feature-title">{{ t("routes.home.vip.plateTitle") }}</span>
            <span class="pack-card__feature-sub">{{ t("routes.home.vip.plateSub") }}</span>
          </div>
        </div>

        <div class="pack-card__action">
          {{ t("routes.home.vip.buy") }}
          <van-icon name="arrow" size="13" />
        </div>
      </div>
    </div>

    <!-- Cuando no-fundador YA tiene pack activo: no mostramos nada (el bloque
         "Mi pack" de arriba ya cubre esa necesidad). -->


    <!-- Stores Section -->
    <div class="px-4 pb-safe-100" style="margin-top: 50px">
      <h2 class="stores-title">{{ t("routes.home.stores.title") }}</h2>

      <!-- Aviso de pre-apertura: la sucursal todavía no opera físicamente -->
      <div v-if="PRE_LAUNCH" class="prelaunch-notice">
        <van-icon name="info-o" size="18" class="prelaunch-notice__icon" />
        <div class="prelaunch-notice__body">
          <span class="prelaunch-notice__title">{{ t("routes.home.preLaunch.title") }}</span>
          <span class="prelaunch-notice__msg">{{ t("routes.home.preLaunch.message") }}</span>
        </div>
      </div>

      <!-- Store from API -->
      <div v-if="shops?.length" class="flex flex-col gap-3">
        <shop-list-item
          v-for="shop in shops"
          :key="shop.storeId"
          :shop="{ ...shop, status: shop.opening ? 'open' : 'closed' }"
          @view="viewShop"
        />
      </div>

      <!-- Fallback: SpeedWash Funes (solo si la API terminó y no trajo nada) -->
      <div v-else-if="shopsLoaded" class="store-card">
        <div class="store-card__left">
          <div class="store-card__top">
            <h3 class="store-card__name">SpeedWash Funes</h3>
            <div class="store-card__status" :class="{ 'store-card__status--soon': PRE_LAUNCH }">
              {{ PRE_LAUNCH ? t('components.shopListItem.status.soon') : 'Abierto' }}
            </div>
          </div>
          <div class="store-card__address">
            <van-icon name="location-o" size="14" color="#ACACB6" />
            <span>Médicos de Funes 1682, Barrio Calmo</span>
          </div>
          <div class="store-card__address">
            <van-icon name="map-marked" size="14" color="#ACACB6" />
            <span>Funes, Santa Fe</span>
          </div>
        </div>
        <a href="https://maps.app.goo.gl/3eQ92L7UJkHcgfNJ8" target="_blank" rel="noopener" class="store-card__link" @click.stop>
          Cómo llegar
          <van-icon name="arrow" size="14" />
        </a>
      </div>
    </div>

    <!-- Ongoing Order Notification -->
    <div
      v-if="hasOngoingOrder"
      class="order-notification"
    >
      <div class="order-notification__pulse"></div>
      <van-icon name="info-o" size="18" color="#FF9416" />
      <span class="order-notification__text">{{ t("routes.home.orderNotification.message") }}</span>
      <van-button type="primary" round size="small" class="order-notification__btn" @click="viewOrder">
        {{ t("routes.home.orderNotification.view") }}
      </van-button>
    </div>
  </div>
</template>

<style scoped>
/* Hero Section */
.hero-section {
  position: relative;
  /* Con el logo recortado (sin margen transparente) el hero es bajo,
     así que devolvemos aire arriba/abajo para que no quede pegado al
     navbar y mantenga buen equilibrio vertical. */
  padding: 30px 24px 26px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 90% at 50% -10%, rgba(0, 187, 252, 0.18) 0%, transparent 55%),
    linear-gradient(160deg, #0B0B0D 0%, #000000 100%);
  z-index: 0;
}

.hero-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(0, 187, 252, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 187, 252, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 75%);
}

.hero-bg::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 187, 252, 0.7) 50%, transparent);
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-logo {
  width: 85%;
  max-width: 340px;
  height: auto;
  object-fit: contain;
  margin: 0 0 8px;
}

.hero-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.5;
  letter-spacing: 0.5px;
}

/* Microbanner informativo bajo el tagline. Legible de un vistazo,
   sin competir con el CTA naranja de escaneo. */
.hero-microbanner {
  display: inline-block;
  margin: 8px 0 0;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(0, 187, 252, 0.08);
  border: 1px solid rgba(0, 187, 252, 0.18);
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.3px;
}

/* Scan CTA Button */
.scan-cta {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #FF9416 0%, #FFB04D 100%);
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(255, 148, 22, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.scan-cta:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(255, 148, 22, 0.28);
}

.scan-cta__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.scan-cta__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scan-cta__title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.3px;
}

.scan-cta__subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

/* Banner */
.banner-swipe {
  border-radius: 12px;
  overflow: hidden;
  height: 140px;
}

.banner-img {
  height: 140px !important;
}

.banner-img :deep(.van-image__img) {
  height: 140px !important;
  object-fit: cover;
}

/* Packs de lavado */
.service-cards-section {
  margin-top: 30px !important;
}

.pack-card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(130% 120% at 100% 0%, rgba(255, 148, 22, 0.14) 0%, transparent 55%),
    var(--surface-color);
  border: 1px solid rgba(255, 148, 22, 0.4);
  border-radius: 18px;
  padding: 16px 16px 14px;
  cursor: pointer;
  box-shadow: 0 12px 30px -18px rgba(255, 148, 22, 0.5);
  transition: transform 0.2s;
}

.pack-card:active {
  transform: scale(0.98);
}

/* Variante fundador — dorado saturado + borde más intenso. Se distingue
   claramente del naranja regular para que el fundador sienta que "esto es
   distinto, es MI bloque". */
.pack-card--founder {
  background:
    radial-gradient(130% 120% at 100% 0%, rgba(255, 210, 77, 0.22) 0%, transparent 55%),
    linear-gradient(135deg, rgba(212, 160, 23, 0.10) 0%, var(--surface-color) 100%);
  border: 1px solid rgba(255, 210, 77, 0.6);
  box-shadow:
    0 0 32px rgba(255, 210, 77, 0.15),
    0 12px 30px -18px rgba(212, 160, 23, 0.5);
}

.pack-card__glow {
  position: absolute;
  top: -50px;
  right: -40px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 148, 22, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

.pack-card__glow--founder {
  background: radial-gradient(circle, rgba(255, 210, 77, 0.28) 0%, transparent 70%);
}

.pack-card__head {
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
}

.pack-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF9416 0%, #FFB04D 100%);
  box-shadow: 0 8px 18px -6px rgba(255, 148, 22, 0.7);
}

.pack-card__icon--founder {
  background: linear-gradient(135deg, #D4A017 0%, #FFD24D 100%);
  box-shadow: 0 8px 18px -6px rgba(212, 160, 23, 0.7);
}

.pack-card__title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  margin: 0;
}

.pack-card__desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 2px 0 0;
}

.pack-card__feature {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 187, 252, 0.08);
  border: 1px solid rgba(0, 187, 252, 0.22);
  color: var(--primary-light);
  line-height: 1.35;
}

.pack-card__feature .van-icon {
  flex-shrink: 0;
}

.pack-card__feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pack-card__feature-title {
  font-size: 13px;
  font-weight: 600;
}

.pack-card__feature-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
}

.pack-card__action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  color: #FF9416;
  margin-top: 12px;
}

.pack-card__action--founder {
  color: #FFD24D;
}

/* Mi pack — bloque del que ya compró (azul LED, contrasta con el naranja de compra) */
.mypack-card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(130% 120% at 100% 0%, rgba(0, 187, 252, 0.16) 0%, transparent 55%),
    var(--surface-color);
  border: 1px solid rgba(0, 187, 252, 0.4);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 12px 30px -18px rgba(0, 187, 252, 0.5);
}

.mypack-card__head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mypack-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-color) 55%, var(--primary-dark) 100%);
  box-shadow: 0 8px 18px -6px rgba(0, 187, 252, 0.7);
}

.mypack-card__title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  margin: 0;
}

.mypack-card__count {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-light);
  margin: 2px 0 0;
}

/* Estado de patente: ámbar cuando falta vincular (acción pendiente), verde cuando está lista */
.mypack-card__plate {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 148, 22, 0.08);
  border: 1px solid rgba(255, 148, 22, 0.28);
  color: #FF9416;
}

.mypack-card__plate--ready {
  background: rgba(var(--brand-success-rgb), 0.1);
  border-color: rgba(var(--brand-success-rgb), 0.3);
  color: var(--brand-success);
}

.mypack-card__plate .van-icon {
  flex-shrink: 0;
}

.mypack-card__plate-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mypack-card__plate-title {
  font-size: 13px;
  font-weight: 700;
}

.mypack-card__plate-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  line-height: 1.35;
}

.mypack-card__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  height: 44px;
  margin-top: 14px;
  border: none;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 700;
  color: #001016;
  cursor: pointer;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-color) 55%, var(--primary-dark) 100%);
  box-shadow: 0 8px 20px -8px rgba(0, 187, 252, 0.7);
  transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
}

.mypack-card__cta:active {
  transform: scale(0.98);
  filter: brightness(1.05);
  box-shadow: 0 4px 12px -6px rgba(0, 187, 252, 0.6);
}

/* Stores Section */
.stores-title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.stores-list {
  border-radius: 12px;
  overflow: hidden;
}

/* Store Card */
.store-card {
  background: var(--surface-color);
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 8px 24px -16px rgba(0, 0, 0, 0.8);
  border: 1px solid var(--line-color);
}

.store-card__top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.store-card__name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.store-card__status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
  background: rgba(var(--brand-success-rgb), 0.14);
  color: var(--brand-success);
}

.store-card__status--soon {
  background: rgba(255, 148, 22, 0.14);
  color: #FF9416;
}

/* Aviso de pre-apertura (arriba de las sucursales) */
.prelaunch-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 148, 22, 0.08);
  border: 1px solid rgba(255, 148, 22, 0.3);
}

.prelaunch-notice__icon {
  color: #FF9416;
  flex-shrink: 0;
  margin-top: 1px;
}

.prelaunch-notice__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.prelaunch-notice__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.prelaunch-notice__msg {
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--text-secondary);
}

.store-card__address {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 3px;
}

.store-card__link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #00BBFC;
  text-decoration: none;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--line-color);
}

/* Order Notification */
.order-notification {
  position: fixed;
  bottom: calc(var(--van-tabbar-height) + env(safe-area-inset-bottom) + 12px);
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--surface-2);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 148, 22, 0.35);
  z-index: 50;
}

.order-notification__text {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.order-notification__btn {
  flex-shrink: 0;
}
</style>

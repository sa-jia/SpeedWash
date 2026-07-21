<script setup>
import StoreThumb from "@/assets/store/store-thumb.png";
import { PRE_LAUNCH } from "@/constants";

const { t } = useI18n();
const props = defineProps({
  shop: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["view"]);

// Imagen de la sucursal — usamos el render de marca (el backend manda una imagen genérica)
const shopImage = computed(() => StoreThumb);

// En pre-apertura ignoramos el "Abierto" del backend y mostramos "Próximamente"
// (ver PRE_LAUNCH). Cuando abramos, el badge vuelve a reflejar el estado real.
const badgeState = computed(() => (PRE_LAUNCH ? "soon" : props.shop.status));

// Texto de estado
const statusText = computed(() =>
  t(`components.shopListItem.status.${badgeState.value}`)
);

const handleView = () => {
  emit("view", props.shop.storeId);
};
</script>

<template>
  <div class="shop-card" @click="handleView">
    <!-- Foto a sangre -->
    <div class="shop-card__media">
      <van-image
        :src="shopImage"
        class="shop-card__img"
        fit="cover"
        :alt="shop.storeName"
        error-icon="photo-fail"
      />
    </div>

    <!-- Info -->
    <div class="shop-card__info">
      <div class="shop-card__name">{{ shop.storeName }}</div>
      <div class="shop-card__addr">{{ shop.address }}</div>
    </div>

    <!-- Estado (esquina superior derecha) -->
    <div
      class="status-badge status-badge--corner"
      :class="`status-badge--${badgeState === 'open' ? 'open' : badgeState === 'soon' ? 'soon' : 'closed'}`"
    >
      <span class="status-badge__dot"></span>
      {{ statusText }}
    </div>

    <!-- CTA -->
    <button class="shop-card__btn" type="button" @click.stop="handleView">
      {{ t('components.shopListItem.view') }}
      <van-icon name="arrow" />
    </button>
  </div>
</template>

<style scoped>
.shop-card {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 96px;
  /* isolation crea un stacking context propio → el badge absoluto interno
     nunca puede quedar por encima de elementos externos (tabbar, etc.),
     aunque su z-index sea alto. */
  isolation: isolate;
  background: var(--surface-color);
  border: 1px solid var(--line-color);
  border-radius: 16px;
  /* `clip` es más estricto que `hidden` — evita casos raros de overflow con
     transforms/hardware-acceleration donde `hidden` no recorta bien. */
  overflow: clip;
  cursor: pointer;
  box-shadow: 0 10px 28px -18px rgba(0, 0, 0, 0.85);
  transition: transform 0.2s, border-color 0.2s;
}

.shop-card:active {
  transform: scale(0.99);
}

/* Foto: llena el alto de la tarjeta, sin margen */
.shop-card__media {
  width: 132px;
  flex-shrink: 0;
  align-self: stretch;
}

.shop-card__img {
  width: 100%;
  height: 100%;
  display: block;
}

.shop-card__img :deep(.van-image__img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Info */
.shop-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 14px 12px 14px 14px;
}

.shop-card__name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shop-card__addr {
  font-size: 13.5px;
  color: var(--text-secondary);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shop-card__btn {
  align-self: flex-end;
  flex-shrink: 0;
  margin: 0 14px 14px 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 34px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #001016;
  cursor: pointer;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-color) 55%, var(--primary-dark) 100%);
  box-shadow: 0 8px 20px -8px rgba(0, 187, 252, 0.7);
  transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
}

.shop-card__btn:active {
  transform: scale(0.95);
  filter: brightness(1.05);
  box-shadow: 0 4px 12px -6px rgba(0, 187, 252, 0.6);
}

.shop-card__btn .van-icon {
  font-size: 13px;
}

/* Badge de estado */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 4px 11px 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1;
}

.status-badge--corner {
  position: absolute;
  top: 8px;
  right: 10px;
  /* z-index removido: no necesita elevarse dentro de la card, y evitar
     stacking contexts arriba del tabbar (500) es lo más seguro. */
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

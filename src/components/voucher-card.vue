<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  title: {
    type: String,
    required: false,
  },
  cardInfo: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  selectable: {
    type: Boolean,
    default: false
  }
});

// Texto de origen de la tarjeta
const getCardFromText = (cardFrom) => {
  const fromMap = {
    1: t('components.voucherCard.from.newUser'),
    2: t('components.voucherCard.from.inviteReward'),
    3: t('components.voucherCard.from.admin'),
    4: t('components.voucherCard.from.purchase')
  };
  return fromMap[cardFrom] || '';
};

const tagText = computed(() => getCardFromText(props.cardInfo.cardFrom));

const canUse = computed(() => props.cardInfo.state === 1);

const slots = useSlots();
</script>

<template>
  <div class="voucher-card" :class="{ 'voucher-card--active': active, 'voucher-card--disabled': !canUse }">
    <!-- Cuerpo: VIP + info -->
    <div class="voucher-card__body">
      <!-- Lado izquierdo: VIP -->
      <div class="voucher-card__left">
        <span class="voucher-card__vip-text">
          {{ title || t("components.couponCard.defaultTitle") }}
        </span>
        <van-tag class="voucher-card__tag" size="medium">
          {{
            t("components.couponCard.availableTimes", {
              count: cardInfo.remainWashCount,
            })
          }}
        </van-tag>
      </div>

      <div class="voucher-card__divider"></div>

      <!-- Lado derecho: info -->
      <div class="voucher-card__right">
        <div class="voucher-card__info">
          <div class="voucher-card__name">{{ cardInfo.cardName }}</div>
          <div
            class="voucher-card__plate"
            :class="{ 'voucher-card__plate--empty': !cardInfo.licenseNo }"
          >
            <van-icon :name="cardInfo.licenseNo ? 'passed' : 'info-o'" />
            <span v-if="cardInfo.licenseNo">{{ cardInfo.licenseNo }}</span>
            <span v-else>{{ t("routes.voucher.licensePlate.none") }}</span>
          </div>
          <div class="voucher-card__expiry">
            {{ t("components.couponCard.expiryDate") }}:
            {{ cardInfo.expiryDate }}
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones full-width abajo -->
    <div class="voucher-card__footer" v-if="slots.action">
      <slot name="action" />
    </div>

    <div class="voucher-card__origin" v-if="tagText">
      <van-tag type="primary" size="medium" round>{{ tagText }}</van-tag>
    </div>
  </div>
</template>

<style scoped>
.voucher-card {
  display: flex;
  flex-direction: column;
  background: var(--surface-color);
  border: 1px solid var(--line-color);
  border-radius: 16px;
  padding: 16px 0 0;
  box-shadow: 0 8px 24px -16px rgba(0, 0, 0, 0.8);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.voucher-card__body {
  display: flex;
  align-items: center;
}

.voucher-card--active {
  border: 2px solid #00BBFC;
  box-shadow: 0 4px 18px rgba(0, 187, 252, 0.25);
}

.voucher-card--disabled {
  filter: grayscale(100%);
  opacity: 0.7;
}

.voucher-card__left {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  gap: 8px;
  min-width: 80px;
}

.voucher-card__vip-text {
  font-size: 22px;
  font-weight: 800;
  color: #00BBFC;
  line-height: 1;
}

.voucher-card__tag {
  background: linear-gradient(135deg, #00BBFC 0%, #0090CC 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600;
  font-size: 11px;
}

.voucher-card__divider {
  width: 1px;
  height: 60px;
  border-left: 1px dashed var(--line-color);
  flex-shrink: 0;
}

.voucher-card__right {
  flex: 1;
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.voucher-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.voucher-card__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Chip de patente vinculada — claro de un vistazo */
.voucher-card__plate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--primary-light);
  background: rgba(0, 187, 252, 0.12);
  border: 1px solid rgba(0, 187, 252, 0.35);
}

.voucher-card__plate--empty {
  font-weight: 500;
  letter-spacing: normal;
  color: var(--text-secondary);
  background: transparent;
  border-color: var(--line-color);
}

.voucher-card__expiry {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Acciones full-width abajo de la tarjeta */
.voucher-card__footer {
  display: flex;
  gap: 10px;
  padding: 14px 16px 16px;
  margin-top: 14px;
  border-top: 1px solid var(--line-color);
}

.voucher-card__origin {
  position: absolute;
  top: 0;
  right: 0;
}

.voucher-card__origin :deep(.van-tag) {
  background: linear-gradient(135deg, #FF9416 0%, #FFB04D 100%) !important;
  border: none !important;
  border-radius: 0 16px 0 12px !important;
  padding: 2px 10px;
  font-weight: 600;
}
</style>

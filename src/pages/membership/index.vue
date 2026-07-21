<script setup>
import { PAYMENT_FROM, PAYMENT_METHOD } from "@/constants";
import { useFounderStatus, isFounderCard } from "@/composables/useFounderStatus";

const { t } = useI18n();
const router = useRouter();
const showLoginDialog = ref(false);

const { loading: confirmLoading, create } = usePayment({
  from: PAYMENT_FROM.VIP_CARD,
})

// 获取会员卡数据
const { data, error, isFetching } = vipCardApi.canBuyList();

// Detección de fundador (ver composables/useFounderStatus.js). Determina qué
// packs se muestran: los fundadores ven SOLO Pack Fundador X4/X8, los no
// fundadores ven SOLO Socios VIP / Exclusivo Socios (los Fundador quedan
// filtrados del listado para no darles pista del beneficio).
const { isFounder, isPromoActive } = useFounderStatus();

// 选中的卡片
const selectedCard = ref(null);
// 当前用户的会员身份
const identityList = computed(() => data.value?.membership || []);
// Packs raw del backend, sin filtrar.
const allVipCards = computed(() => data.value?.canBuyList || []);

// Packs a mostrar según status del usuario:
//   - Fundador → SOLO los packs Fundador X4/X8 (con precio preferencial).
//   - No fundador → SOLO los packs regulares (Socios VIP / Exclusivo Socios).
//     Los Fundador se ocultan aunque el backend los devuelva.
const vipCards = computed(() => {
  const all = allVipCards.value;
  if (!isPromoActive.value) return all.filter((c) => !isFounderCard(c));
  return isFounder.value
    ? all.filter(isFounderCard)
    : all.filter((c) => !isFounderCard(c));
});

// 是否有可购买的会员卡
const hasCards = computed(() => vipCards.value?.length > 0)

// 立即购买
const onPurchase = (card) => {
  if (!card || confirmLoading.value) return;
  selectedCard.value = card;

  // 是否仅特殊用户
  if (card.isOnlyMembership) {
    // 可以购买的会员身份
    const membershipList = card.canBuyMembership.split(',')
    // 当前用户的会员身份
    const canBuy = membershipList.some(item => identityList.value.includes(item))

    if (!canBuy) {
      showDialog({
        message: t('routes.membership.dialog.noPermission', { 
          types: membershipList.join('、')
        }),
        theme: 'round-button',
        showCancelButton: true,
        cancelButtonText: t('routes.membership.dialog.cancel'),
        confirmButtonText: t('routes.membership.dialog.apply'),
        onConfirm: () => {
          router.push("/verify");
        }
      })
      return
    }
  }
  create({
    method: PAYMENT_METHOD.MERCADO_PAGO,
    request: () => vipCardApi.newVipCardOrder(card.cardId),
  })
};

// 去申请
const goToApply = () => {
  router.push("/verify");
};

// Tocar un pack ejecuta la compra directamente (sin paso intermedio).
const selectCard = (card) => {
  onPurchase(card);
};
</script>
<template>
  <div class="py-4 gap-4 flex flex-col pb-safe-80">
    <template v-if="isFetching">
      <van-skeleton :row="3" />
      <van-skeleton :row="3" class="mt-4" />
    </template>
    
    <template v-else-if="hasCards">
      <!-- Banner dorado para fundadores: destaca el beneficio y la fecha
           límite de la promo (31-oct). Sin CTA propio — el CTA de acción
           es la card de pack de abajo (se toca para comprar). -->
      <div v-if="isFounder" class="founder-banner">
        <div class="founder-banner__eyebrow">
          <van-icon name="award" class="founder-banner__icon" />
          {{ t('routes.membership.founder.eyebrow') }}
        </div>
        <div class="founder-banner__title">
          {{ t('routes.membership.founder.title') }}
        </div>
        <div class="founder-banner__sub">
          {{ t('routes.membership.founder.subtitle') }}
        </div>
      </div>

      <p class="vip-hint">{{ t('routes.membership.tapToBuy') }}</p>
      <template v-for="card in vipCards" :key="card.cardId">
        <membership-card
          :card="card"
          :selected="selectedCard?.cardId === card.cardId"
          @click="selectCard(card)"
        />
      </template>
    </template>

    <template v-else>
      <div class="flex flex-col items-center justify-center py-32">
        <van-empty
          :description="t('routes.membership.empty')" 
        />
      </div>
    </template>
  </div>

  <!-- Overlay de carga mientras se inicia el checkout del pack -->
  <van-overlay :show="confirmLoading" class="flex-center">
    <van-loading size="28px" vertical color="#fff">{{ t('common.loading') }}</van-loading>
  </van-overlay>

  <van-dialog v-model:show="showLoginDialog" :title="t('routes.membership.tips.title')"
    :message="t('routes.membership.tips.specialUserOnly')" show-cancel-button
    :cancel-button-text="t('routes.membership.dialog.cancel')"
    :confirm-button-text="t('routes.membership.dialog.apply')" @confirm="goToApply" />
</template>

<style scoped>
.vip-hint {
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 4px;
}

/* Banner dorado del beneficio de fundador — dorado saturado con glow
   sutil, para que se sienta "vip" desde el primer segundo. */
.founder-banner {
  margin: 0 16px 8px;
  padding: 16px 18px 14px;
  border-radius: 16px;
  background:
    radial-gradient(120% 130% at 50% 0%, rgba(255, 195, 0, 0.18) 0%, transparent 60%),
    linear-gradient(135deg, rgba(212, 160, 23, 0.14) 0%, rgba(255, 195, 0, 0.06) 100%);
  border: 1px solid rgba(255, 195, 0, 0.55);
  box-shadow:
    0 0 28px rgba(255, 195, 0, 0.15),
    0 12px 30px -18px rgba(0, 0, 0, 0.85);
}

.founder-banner__eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #FFD24D;
  margin-bottom: 6px;
}

.founder-banner__icon {
  color: #FFD24D;
  font-size: 14px;
}

.founder-banner__title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 4px;
}

.founder-banner__sub {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}
</style>

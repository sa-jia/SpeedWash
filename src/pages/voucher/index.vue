<script setup>
import { vipCardApi } from "@/api";

const router = useRouter();
const route = useRoute();
const { t } = useI18n()

const activeTab = ref(1);
const tabs = [
  { title: t('routes.voucher.usable'), value: 1 },
  { title: t('routes.voucher.used'), value: 2 },
  { title: t('routes.voucher.expired'), value: 3 }
]

const loading = ref(false);
const { data, error, isFetching, execute } = vipCardApi.myCardList(() => ({
  canUseType: activeTab.value,
}));

if (unref(error)) {
  showToast(error.message);
}

const cards = computed(() => (data.value || []).map(card => ({
  ...card,
  state: activeTab.value
})));

const getUnusableText = (state) => {
  return tabs.find(tab => tab.value === state)?.title || '';
}

const useVoucher = (card) => {
  router.push('/scan')
}

const currentCard = ref(null);
const showBind = ref(false);

const inputLicenseNo = card => {
  currentCard.value = card;
  showBind.value = true;
}

const bindLicenseNo = async (licenseNo) => {
  const { error } = await vipCardApi.bindLicenseNo({
    cardId: unref(currentCard).cardId,
    licenseNo
  })
  if (unref(error)) {
    showFailToast(t("routes.voucher.licensePlate.fail"));
    return;
  }
  showSuccessToast(t("routes.voucher.licensePlate.success"));
  execute();
}

// Deep-link desde la home (?bind=1): abre directo la hoja de vincular patente
// del primer abono activo sin patente. Se dispara una sola vez, al cargar la lista.
const autoBindHandled = ref(false);
watch(cards, (list) => {
  if (autoBindHandled.value || !route.query.bind) return;
  if (activeTab.value !== 1 || !list.length) return;
  autoBindHandled.value = true;
  inputLicenseNo(list.find((c) => !c.licenseNo) || list[0]);
}, { immediate: true });
</script>

<template>
  <div class="voucher-page flex flex-col h-default">
    <van-tabs v-model:active="activeTab" sticky @change="execute" class="voucher-tabs">
      <van-tab v-for="tab in tabs" :title="tab.title" :key="tab.value" :name="tab.value" />
    </van-tabs>

    <van-pull-refresh :model-value="isFetching" @refresh="execute" class="flex-1">
      <!-- Empty state -->
      <div v-if="!loading && !cards.length" class="empty-state">
        <div class="empty-state__icon">
          <van-icon name="card" size="48" color="#C0C4C8" />
        </div>
        <p class="empty-state__text">{{ t('routes.voucher.empty') }}</p>
        <van-button
          round
          size="small"
          class="empty-state__btn"
          @click="router.push('/vip')"
        >
          {{ t('routes.voucher.viewPlans') }}
        </van-button>
      </div>

      <!-- Card list -->
      <div v-else class="p-4 gap-4 flex flex-col">
        <template v-for="card in cards" :key="card.cardId">
          <voucher-card :card-info="card">
            <template #action>
              <template v-if="card.state === 1">
                <van-button
                  block
                  round
                  class="voucher-btn voucher-btn--ghost"
                  @click="inputLicenseNo(card)"
                >
                  <van-icon name="orders-o" class="mr-1" />
                  {{ card.licenseNo ? t('routes.voucher.licensePlate.change') : t('routes.voucher.licensePlate.bind') }}
                </van-button>
                <van-button
                  block
                  round
                  class="voucher-btn voucher-btn--primary"
                  @click="() => useVoucher(card)"
                >
                  <van-icon name="scan" class="mr-1" />
                  {{ t('routes.voucher.useNow') }}
                </van-button>
              </template>
              <div v-else class="voucher-unusable">
                {{ getUnusableText(card.state) }}
              </div>
            </template>
          </voucher-card>
        </template>
      </div>
    </van-pull-refresh>

    <bind-license-plate
      v-model:show="showBind"
      :initial="currentCard?.licenseNo"
      @success="bindLicenseNo"
    />
  </div>
</template>

<style scoped>
.voucher-page {
  background: var(--background-color);
}

:deep(.voucher-tabs .van-tabs__nav) {
  background: var(--surface-color);
}

:deep(.voucher-tabs .van-tab--active) {
  color: #00BBFC;
  font-weight: 600;
}

:deep(.voucher-tabs .van-tabs__line) {
  background: #00BBFC;
  width: 24px;
  border-radius: 2px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 24px;
}

.empty-state__icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(192, 196, 200, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-state__text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 20px;
}

.empty-state__btn {
  background: linear-gradient(135deg, #00BBFC 0%, #0090CC 100%);
  color: #fff;
  border: none;
  padding: 0 24px;
  font-weight: 600;
}

/* Botones de acción del abono — full-width, llamativos */
.voucher-btn {
  flex: 1;
  height: 42px;
  font-weight: 700;
  font-size: 14px;
}

.voucher-btn--primary {
  background: linear-gradient(135deg, #00BBFC 0%, #0090CC 100%);
  border: none;
  color: #fff;
  box-shadow: 0 8px 20px -8px rgba(0, 187, 252, 0.6);
}

.voucher-btn--ghost {
  background: rgba(0, 187, 252, 0.1);
  border: 1px solid rgba(0, 187, 252, 0.45);
  color: #00BBFC;
}

.voucher-unusable {
  flex: 1;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}
</style>

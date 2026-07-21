<script setup>
import { PAYMENT_FROM, PAYMENT_METHOD } from "@/constants";
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const { loading: confirmLoading, create } = usePayment({
  from: PAYMENT_FROM.TOP_UP,
});

const { centsToSGD, sgdToCents } = useCurrency();

// Carga
const isLoading = ref(true);

// Lista de planes de recarga
const { data, error } = topUpApi.schemeList();

// Permitir monto personalizado
const allowCustomAmount = computed(
  () => data.value?.allowAnyRechargeAmount || false
);
// Lista de planes
const schemeList = computed(() => data.value?.schemeList || []);

// Opciones de recarga
const topUpOptions = computed(
  () =>
    schemeList.value.map((item) => ({
      amount: centsToSGD(item.payAmount),
      receivedAmount: centsToSGD(item.rechargeAmount),
      ...item,
    })) || []
);

// Monto seleccionado
const selectedSchemeAmount = ref(null);

// Plan seleccionado
const selectedScheme = ref(null);
// ID del plan seleccionado
const selectedSchemeId = computed(() => selectedScheme.value?.schemeId);

// Monto personalizado
const customAmount = ref("");

// Estado de foco
const isCustomAmountFocused = ref(false);

// Monto mínimo de recarga
const MIN_TOP_UP_AMOUNT = 10;

// Validar monto personalizado
function validateCustomAmount() {
  if (customAmount.value && Number(customAmount.value) < MIN_TOP_UP_AMOUNT) {
    showDialog({
      title: t('routes.wallet.topUp.minAmountTitle'),
      message: t("routes.wallet.topUp.minAmountMessage", { amount: MIN_TOP_UP_AMOUNT }),
    })
    return false;
  }
  return true;
}

// Monto actual a pagar
const currentPayAmount = computed(() => {
  if (customAmount.value) {
    return customAmount.value;
  }
  const selectedScheme = topUpOptions.value.find(
    (opt) => opt.schemeId === selectedSchemeId.value
  );
  return selectedScheme?.amount || 0;
});

// Mostrar monto en botón
const showConfirmAmount = computed(() =>
  Boolean(customAmount.value || selectedSchemeId.value)
);

// Botón habilitado
const isButtonEnabled = computed(() =>
  Boolean(
    (customAmount.value && Number(customAmount.value) > 0) ||
      selectedSchemeId.value
  )
);

const showPayment = ref(false);

// Procesar recarga
async function handleTopUp() {
  if (customAmount.value && !validateCustomAmount()) {
    return;
  }

  const amount = customAmount.value ? sgdToCents(customAmount.value) : null;
  const requestData = selectedSchemeId.value
    ? { schemeId: selectedSchemeId.value }
    : { amount };

  create({
    from: PAYMENT_FROM.TOP_UP,
    method: PAYMENT_METHOD.MERCADO_PAGO,
    request: () => topUpApi.newOrder(requestData),
  });
}

// Estado de carga
watchEffect(() => {
  isLoading.value = !data.value && !error.value;
});
</script>

<template>
  <div class="topup-page">
    <!-- Carga -->
    <div v-if="isLoading" class="absolute inset-0 flex-center bg-ink/80">
      <van-loading size="24px" vertical>{{ t("common.loading") }}</van-loading>
    </div>

    <!-- Error -->
    <van-empty v-if="error" :description="error" class="absolute inset-0 flex-center bg-ink">
      <template #image>
        <van-icon name="warning-o" size="48" class="text-text-dim" />
      </template>
    </van-empty>

    <h2 class="topup-title">
      {{ t("routes.wallet.topUp.title") }}
    </h2>

    <option-selector v-model="selectedScheme" :items="topUpOptions" key-field="schemeId">
      <template #default="{ item }">
        <div class="text-center">
          <div class="topup-option__amount">
            <price-tag :price="item.receivedAmount" :convert-cents="false" currency-class="topup-option__currency" />
          </div>
          <div class="topup-option__pay">
            {{ t("routes.wallet.topUp.payAmount", { amount: item.amount }) }}
          </div>
        </div>
      </template>
    </option-selector>

    <div class="topup-custom" v-if="allowCustomAmount">
      <div class="topup-custom__label">
        {{ t("routes.wallet.topUp.customAmountLabel") }}
      </div>
      <van-field v-model="customAmount" type="number" :placeholder="t('routes.wallet.topUp.customAmountPlaceholder')"
        clearable :border="false" :class="[
          'topup-custom__field',
          isCustomAmountFocused ? 'topup-custom__field--focused' : '',
        ]" @focus="
          () => {
            isCustomAmountFocused = true;
            selectedScheme = null;
          }
        " @blur="
          () => {
            isCustomAmountFocused = false;
            selectedScheme = null;
          }
        " />
    </div>

    <van-action-bar class="topup-action-bar">
      <van-action-bar-button type="primary" :loading="confirmLoading" :disabled="!isButtonEnabled" @click="handleTopUp">
        {{ t("routes.wallet.topUp.confirmButton") }}
        <template v-if="showConfirmAmount">
          (<price-tag :price="currentPayAmount" :convert-cents="false" />)
        </template>
      </van-action-bar-button>
    </van-action-bar>
  </div>
</template>

<style scoped>
.topup-page {
  padding: 16px;
  background: var(--background-color);
  min-height: 100vh;
}

.topup-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 8px 0 20px;
}

.topup-option__amount {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
}

.topup-option__currency {
  font-size: 16px;
}

.topup-option__pay {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.topup-custom {
  margin-bottom: 24px;
}

.topup-custom__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 20px 0 10px;
}

.topup-custom__field {
  background: var(--surface-color);
  border: 1px solid var(--line-color);
  border-radius: 12px;
  transition: box-shadow 0.2s;
}

.topup-custom__field--focused {
  box-shadow: 0 0 0 2px #00BBFC;
}

:deep(.van-field) {
  --van-field-input-text-color: var(--text-primary);
  --van-field-placeholder-text-color: var(--text-dim);
  padding: 14px 16px;
  border-radius: 12px;
}

:deep(.van-button--disabled) {
  opacity: 0.5;
}

:deep(.topup-action-bar) {
  background: transparent;
  padding: 0 16px;
}

:deep(.van-action-bar-button--first) {
  border-radius: 24px;
}

:deep(.van-action-bar-button--last) {
  border-radius: 24px;
}

:deep(.van-button--primary) {
  background: linear-gradient(135deg, #00BBFC 0%, #0090CC 100%);
  border: none;
  font-weight: 700;
}
</style>

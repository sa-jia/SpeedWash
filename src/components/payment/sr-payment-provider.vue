<script setup>
import { PAYMENT_METHOD } from "@/constants";
import MgPaymentPopup from "./mercado-pago-payment-popup.vue";

const priceRef = ref(null);
const requestRef = ref(null);
const onSuccessRef = ref(null);
const onFailRef = ref(null);
const onFinishRef = ref(null);

const fromRef = ref(null);
const methodRef = ref(null);
const oidRef = ref(null);
const convertCentsRef = ref(true);
const createPaymentRef = ref(false);
const showPaymentRef = ref(false);

const preferenceIdRef = ref(null);
const publicKeyRef = ref(null);

const loading = ref(false);

const { t } = useI18n();
const { success, fail } = usePaymentResult();
const { centsToSGD } = useCurrency();

const destroy = () => {
  createPaymentRef.value = false;
  showPaymentRef.value = false;
};

provide("SrPaymentProvider", {
  create: useDebounceFn((options) => {
    // 保存 options 的 onSuccess 和 onFail
    const { onSuccess, onFail, onFinish, price, request, oid, from, method, convertCents } =
      options;

    const useMercadoPago = method === PAYMENT_METHOD.MERCADO_PAGO;
    const useBalance = method === PAYMENT_METHOD.BALANCE;

    priceRef.value = price;
    convertCentsRef.value = convertCents

    requestRef.value = request;
    onSuccessRef.value = onSuccess;
    onFailRef.value = onFail;
    onFinishRef.value = onFinish;

    fromRef.value = from;
    methodRef.value = method;
    oidRef.value = oid;

    loading.value = true;

    createPaymentRef.value = useMercadoPago;
    request?.()
      .then(({ data, error }) => {
        if (unref(error)) {
          onFail?.();
          showToast(unref(error));
          return;
        }
        // 余额支付, 直接成功.
        if (useBalance) {
          onSuccess?.();
          success({ oid, from, method });
          return;
        }

        const { preferenceId, publicKey, payAmount } = unref(data);

        preferenceIdRef.value = preferenceId;
        publicKeyRef.value = publicKey;
        priceRef.value = payAmount;
        // Mercado Pago 支付, 需要显示弹窗.
        showPaymentRef.value = useMercadoPago;
      })
      .finally(() => {
        loading.value = false;
        onFinish?.();
      });

    return {
      destroy,
      loading,
    };
  }, 300), // 300ms debounce delay
  loading,
});

function handleSuccess() {
  onSuccessRef.value?.();
  success({ oid: oidRef.value, from: fromRef.value, method: methodRef.value });
  destroy();
}

function handleFail(error) {
  onFailRef.value?.();
  // destroy();
  showToast(error.message || t("common.fail"));
}

function handleLoaded() {
  onFinishRef.value?.();
}
</script>

<template>
  <slot />
  <!-- 
    如果使用余额支付, 则显示 loading 状态 TODO: 显示 支付中 的提示, 弹窗动画
    如果使用 Mercado Pago 支付, 则显示 Mercado Pago 支付弹窗
  -->
  <mg-payment-popup v-if="createPaymentRef" v-model:show="showPaymentRef" :loading="loading" :price="priceRef"
    :from="fromRef" :convert-cents="convertCentsRef" :preference-id="preferenceIdRef" :public-key="publicKeyRef"
    @success="handleSuccess" @fail="handleFail" @loaded="handleLoaded" @close="destroy" />
</template>

<style scoped></style>

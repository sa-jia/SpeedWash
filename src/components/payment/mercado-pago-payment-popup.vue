<script setup>
// import Spinners from "@/assets/stripe/spinners.svg"
import { PAYMENT_FROM, PAYMENT_METHOD } from "@/constants";
const { t } = useI18n();

const show = defineModel("show");

const props = defineProps({
  price: {
    type: Number,
    required: true,
  },

  preferenceId: {
    type: String,
    required: true,
    // validator: (value) => value && value.startsWith("pi_"),
  },
  publicKey: {
    type: String,
    required: true,
    // validator: (value) => value && value.startsWith("pk_"),
  },

  from: {
    type: String,
    required: true,
  },

  convertCents: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["success", "fail", "close", "loaded"]);
const { getResultUrl } = usePaymentResult();

const isLoading = ref(true);
const height = computed(() => {
  return isLoading.value ? "45%" : "90%";
});
// const apiError = ref(null);

// watch(
//   show,
//   (value) => {
//     if (!value) {
//       // 清理函数
//       return;
//     }
//     isLoading.value = true;
//     // apiError.value = null;
//     // props.request?.().then(({ error, data }) => {
//     //   apiError.value = unref(error);
//     //   if (unref(error)) return;
//     //   clientSecretRef.value = unref(data).clientSecret;
//     //   stripePublicKeyRef.value = unref(data).stripePublicKey;
//     // }).finally(() => {
//     //   isLoading.value = false;
//     // });
//   },
//   { immediate: true }
// );

const paymentItemMap = {
  [PAYMENT_FROM.TOP_UP]: t("common.paymentItem.top_up"),
  [PAYMENT_FROM.VIP_CARD]: t("common.paymentItem.vipCard"),
  [PAYMENT_FROM.WASH_ORDER]: t("common.paymentItem.carWash"),
  [PAYMENT_FROM.ORDER]: t("common.paymentItem.carWash"),
};

const paymentTitle = computed(() => {
  return paymentItemMap[props.from] || ""
});

const returnUrl = computed(() => {
  return getResultUrl({
    from: props.from,
    method: PAYMENT_METHOD.MERCADO_PAGO,
    stringify: true,
  });
});

// const paymentElement = ref(null);
// 清理函数
// const cleanup = () => {
//   if (paymentElement.value) {
//     paymentElement.value.destroy();
//     paymentElement.value = null;
//   }
//   if (elements) {
//     elements = null;
//   }
// };
// 关闭弹窗
function handleClose() {
  show.value = false;
  // cleanup();
  emit("close");
}

function handleLoaderstart() {
  isLoading.value = false;
}

function handleLoaded() {
  emit("loaded");
}

// 支付成功
function handleSuccess() {
  emit("success");
  handleClose();
}

function handleFail(error) {
  emit("fail", error);
}

const isReady = computed(() => {
  return !!(show.value && props.publicKey && props.preferenceId)
})

watch(isReady, (newValue) => {
  if (!newValue) {
    return;
  }
  const mp = new MercadoPago(props.publicKey);
  mp.bricks().create("wallet", "mercado-pago-form", {
    initialization: {
      preferenceId: props.preferenceId
    },
  });
});

</script>

<template>
  <van-popup v-model:show="show" teleport="body" round position="bottom" closeable safe-area-inset-bottom
    close-icon="close" close-icon-position="top-left" :style="{ height }" @close="handleClose">
    <div class="h-full flex flex-col pt-54px">
      <!-- 标题和价格区域 -->
      <div class="flex flex-col items-center text-2rem mb-16px">
        <span v-if="paymentTitle" class="mb-5px">
          {{ paymentTitle }}
        </span>
        <price-tag class="text-6xl" :price="price" :convert-cents="convertCents" currency-class="text-2rem" />
      </div>

      <!-- 支付表单区域 -->
      <div id="mercado-pago-form" class="flex-1" :class="{ 'overflow-y-auto': !isLoading }">
        <!-- 加载态 -->
<!--        <div v-if="isLoading" class="flex-center py-8">-->
<!--          <spinners :width="28" />-->
<!--        </div>-->

        <!-- 错误提示 -->
<!--        <div v-else-if="error" class="text-center py-8">-->
<!--          <van-empty :description="error">-->
<!--            <template #image>-->
<!--              <van-icon name="warning-o" size="48" class="text-gray-400" />-->
<!--            </template>-->
<!--          </van-empty>-->
<!--        </div>-->

        <!-- Mercado Pago 支付表单 -->
<!--        <sr-checkout-form class="flex-1 px-4 py-1" v-if="preferenceId && publicKey" :client-secret="clientSecret"-->
<!--          :public-key="publicKey" :return-url="returnUrl" @loaderstart="handleLoaderstart" @success="handleSuccess"-->
<!--          @fail="handleFail" @loaded="handleLoaded" />-->
      </div>
    </div>
  </van-popup>
</template>

<style scoped></style>

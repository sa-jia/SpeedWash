<script setup>
import { useCountDown } from "@vant/use";
import { PAYMENT_FROM, PAYMENT_STATUS } from "@/constants";
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const { oid, from } = route.query;

// TODO: 待优化, 可使用 PAYMENT_STATUS 代替
const {
  isWashOrder,
  orderNo,
  success,
  paymentSuccess,
  machineStartSuccess,
  error,
  status,
  isActive,
} = usePaymentCheck();

const { isRegistered, isLogin, isGuest } = storeToRefs(useUserStore());

const showMachineFailure = ref(false);

const SHOW_MACHINE_FAILURE_DELAY = 2000; // 2秒后显示
const REDIRECT_DELAY = 5000; // 5秒后跳转

const action = computed(() => {
  // Sin cuenta real (invitado, o vuelta de Mercado Pago sin sesión) todos los
  // destinos posibles —/order/:id, /vouchers, /wallet— son rutas protegidas:
  // mandarlo ahí lo rebota a /login y termina en la misma pantalla confusa que
  // veníamos de arreglar. Lo dejamos en la home, que sí puede ver.
  if (isGuest.value || !isRegistered.value) {
    return {
      path: "/",
      title: t("routes.payment.result.actions.backHome"),
    };
  }

  if (isWashOrder.value) {
    // Redirect al detalle del pedido específico (no a la lista), así el
    // usuario ve el estado del lavado en tiempo real y tiene a mano el botón
    // de emergencia mientras la máquina está lavando (washStatus=2).
    return {
      path: oid ? `/order/${oid}` : "/orders",
      title: t("routes.payment.result.actions.viewOrder"),
    };
  }
  if (from === PAYMENT_FROM.VIP_CARD) {
    return {
      path: "/vouchers",
      title: t("routes.payment.result.actions.viewVoucher"),
    };
  }
  if (from === PAYMENT_FROM.TOP_UP) {
    return {
      path: "/wallet",
      title: t("routes.payment.result.actions.viewWallet"),
    };
  }
  return null;
});

function doAction() {
  if (action.value) {
    router.replace(action.value.path);
  }
}

// 倒计时
const { current, start } = useCountDown({
  time: REDIRECT_DELAY,
  onFinish: doAction,
});

// 按钮处理函数
const handleBackHome = () => {
  router.replace("/");
};
// 组件卸载时清理定时器

watch(
  status,
  (newVal) => {
    // Solo las órdenes de lavado hacen polling que luego actualizará el estado;
    // para el resto (VIP/recarga) un estado no-final ya es definitivo y debe
    // disparar la cuenta regresiva/redirección, si no la pantalla queda colgada.
    if (
      (newVal === PAYMENT_STATUS.PROCESSING ||
        newVal === PAYMENT_STATUS.PENDING) &&
      isWashOrder.value
    ) {
      return;
    }

    if (
      isWashOrder.value &&
      paymentSuccess.value &&
      !machineStartSuccess.value
    ) {
      setTimeout(() => {
        showMachineFailure.value = true;
        start();
      }, SHOW_MACHINE_FAILURE_DELAY);
    } else {
      start();
    }
  },
  { immediate: true }
);
</script>

<template>
  <!-- 先不传状态 -->
  <page-status :is-loading="isActive" v-if="isActive" />
  <div class="flex flex-col items-center px-4 h-full" v-else>
    <!-- 支付结果动画 -->
    <div class="mt-20 mb-4">
      <div class="flex-center flex-col" v-if="showMachineFailure">
        <sr-machine-failure />
        <p class="mt-4 text-3xl fw-bold text-red-500">{{ t('routes.payment.result.machineFailure') }}</p>
      </div>
      <sr-payment-result :status="status" v-else />
    </div>
    
    <!-- 支付状态文本 -->
    <p class="text-[#969799] text-sm mb-4">
      {{ t('routes.payment.result.countdown', { seconds: current.seconds }) }}
    </p>

    <p class="text-text-primary text-xl mb-4" v-if="orderNo">
      {{ t('routes.payment.result.orderNo', { no: orderNo }) }}
    </p>

    <!-- 按钮组 -->
    <van-action-bar class="px-5 gap-5 !bg-transparent">
      <van-button
        block
        plain
        class="flex-1"
        :hairline="false"
        @click="handleBackHome"
      >
        {{ t('routes.payment.result.actions.backHome') }}
      </van-button>
      <van-button
        v-if="action && !isGuest"
        block
        type="primary"
        class="flex-1"
        :hairline="false"
        @click="doAction"
      >
        {{ action.title }}
      </van-button>
    </van-action-bar>
  </div>
</template>

<style scoped>
:deep(.van-button) {
  height: 44px;
  border-radius: 22px;
}

:deep(.van-button--plain) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

:deep(.van-button--primary) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}
</style>

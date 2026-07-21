<script setup>
import { storeToRefs } from "pinia";
import { PAYMENT_FROM, PAYMENT_METHOD } from "@/constants";
import { useCountDown } from "@vant/use";
import PaymentLinkIcon from "@/assets/icons/stash--payment-link.svg";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const { isLoading, error, watchError, watchLoading } = usePageStatus();

const userStore = useUserStore();
const { isGuest, isRegistered, isLogin } = storeToRefs(userStore);

// 从query中获取参数
const { oid, from } = route.query;
const payTimeout = ref(Number(route.query.timeout)); // 支付超时时间戳

function diffTime(_time) {
  if (!_time) return 0;
  const diff = _time - Date.now();
  if (diff > 0) {
    return diff;
  }
  return 0;
}



const countDownTime = computed(() => {
  return countDown.current.value.total;
});

// 支付超时时间
// const time = computed(() => {
//   return
// });
const { loading: confirmLoading, create } = usePayment(route.query);

const paymentResult = usePaymentResult();

function payFail() {
  orderError.value = t("routes.order.payment.failed");
  paymentResult.fail({
    ...route.query,
    cancel: false,
    timeout: true,
    from: PAYMENT_FROM.WASH_ORDER,
  });
}

const countDown = useCountDown({
  time: diffTime(payTimeout.value),
  onFinish: payFail,
});
// 支付方式
const paymentMethod = ref("");

// 查询订单
const { data, error: orderError, isFetching } = washApi.payResultCheck(oid);

watch(data, (newData) => {
  const { isPaySuccess, isStartSuccess, balance, price, timeout } = newData;

  // console.log(newData);
  if (newData.isPaySuccess) {
    paymentResult.success({
      oid,
      from,
      // method: PAYMENT_METHOD.BALANCE,
    });
  }

  // 设置倒计时, timeout 是支付超时时间戳
  const diff = diffTime(timeout);
  countDown.reset(diff);
  countDown.start();
});

// 是否启用余额
const isBalanceEnabled = computed(() => {
  return isRegistered.value && data.value?.balance >= data.value?.price;
});

// 监听错误和加载状态
watchError(orderError);
watchLoading(isFetching);

// 确认支付
async function onConfirmPayment() {
  const method = paymentMethod.value;
  create({
    method,
    request: () =>
      method === PAYMENT_METHOD.BALANCE
        ? washApi.balancePay(oid)
        : washApi.mercadoPagoPay(oid),
  });
}

function onBalanceClick() {
  if (!isBalanceEnabled.value) {
    return;
  }
  paymentMethod.value = PAYMENT_METHOD.BALANCE;
}
</script>

<template>
  <page-status :is-loading="isLoading" :error="error" />

  <!-- 支付金额 -->
  <div class="px-4 py-8xl text-centers flex flex-col items-center gap-4">
    <price-tag
      class="font-medium leading-none color-primary"
      :price="data?.price"
      currency-class="text-32"
      integer-class="text-64"
      decimal-class="text-64"
    />
    <div class="mt-2 font-size-[var(--van-font-size-md)] flex-center">
      <van-count-down :time="countDownTime">
        <template #default="timeData">
          {{ t("routes.order.payment.countdown_prefix")
          }}{{ timeData.hours.toString().padStart(2, "0") }}:{{
            timeData.minutes.toString().padStart(2, "0")
          }}:{{ timeData.seconds.toString().padStart(2, "0")
          }}{{ t("routes.order.payment.countdown_suffix") }}
        </template>
      </van-count-down>
    </div>
  </div>

  <!-- 支付方式列表 -->
  <van-radio-group v-model="paymentMethod">
    <van-cell-group inset>
      <!-- 余额支付 -->
      <van-cell clickable @click="onBalanceClick" :disabled="!isBalanceEnabled">
        <template #title>
          <div class="flex items-center gap-3 h-100">
            <van-icon name="balance-pay" class="text-primary" size="24" />
            <div class="flex gap-1 items-center text-26 font-bold">
              <div>{{ t("routes.order.payment.methods.balance.title") }}</div>
              <div class="text-gray-400">
                ({{ t("routes.order.payment.methods.balance.available") }}:
                <price-tag :price="data?.balance" />)
              </div>
            </div>
          </div>
        </template>
        <template #right-icon>
          <van-radio :name="PAYMENT_METHOD.BALANCE" :disabled="!isBalanceEnabled" />
        </template>
      </van-cell>

      <!-- Mercado Pago支付 -->
      <van-cell clickable @click="paymentMethod = PAYMENT_METHOD.MERCADO_PAGO" :disabled="!isBalanceEnabled">
        <template #title>
          <div class="flex items-center gap-3 h-100">
            <payment-link-icon class="text-[#635bff] h-24px w-24px" />
            <div class="text-26 font-bold">
              {{ t("routes.order.payment.methods.online.title") }}
            </div>
          </div>
        </template>
        <template #right-icon>
          <van-radio :name="PAYMENT_METHOD.MERCADO_PAGO" />
        </template>
      </van-cell>
    </van-cell-group>
  </van-radio-group>

  <!-- 底部确认按钮 -->
  <van-action-bar>
    <van-action-bar-button
      type="danger"
      :disabled="!paymentMethod"
      :text="t('routes.order.payment.confirm')"
      :loading="confirmLoading"
      @click="onConfirmPayment"
    />
  </van-action-bar>
</template>

<style scoped>
:deep(.van-radio__icon) {
  --van-radio-size: 20px;
}

:deep(.van-radio__icon--checked .van-icon) {
  background-color: #00BBFC;
  border-color: #00BBFC;
}
</style>

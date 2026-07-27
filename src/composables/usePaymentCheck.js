import { washApi } from "@/api";
import { PAYMENT_CHECK, PAYMENT_FROM, PAYMENT_STATUS } from "@/constants";
import { resolvePaymentStatus } from "@/utils/payment-status";


export function usePaymentCheck() {
  const route = useRoute();
  // 暂不处理 cancel
  const { cancel, timeout, oid, from } = route.query;

  // 状态: normaliza el estado que devuelve Mercado Pago (approved/pending/...)
  // al vocabulario interno de la app (success/pending/...).
  const status = ref(resolvePaymentStatus(route.query));

  // 有订单id(来自洗车订单)，即为洗车订单
  const isWashOrder = ref(
    !!oid && (from === PAYMENT_FROM.ORDER || from === PAYMENT_FROM.WASH_ORDER)
  );
  /**
   * 是否使用检查, 洗车订单使用检查
   *
   * Requiere token: `payResultCheck` es un endpoint autenticado. Al volver de
   * Mercado Pago puede no haber sesión (ver por qué en la nota de
   * "PaymentResult" en src/modules/router.js). Sin token el polling devolvería
   * 999 en loop y la pantalla se quedaría colgada en el spinner. Cuando no se
   * puede chequear, mostramos el estado que informa MP en los query params —
   * imperfecto para el lavado (no dice si la máquina arrancó), pero es una
   * respuesta en vez de una pantalla trabada.
   */
  const hasSession = !!useUserStore().getToken();
  const useCheck = unref(isWashOrder) && hasSession;
  /**
   * 是否成功
   * 洗车订单依赖于支付结果和洗车机状态, 其他订单依赖于 route.query.status === PAYMENT_STATUS.SUCCESS
   */
  const success = ref(
    unref(isWashOrder) ? false : unref(status) === PAYMENT_STATUS.SUCCESS
  );
  // 支付成功
  const paymentSuccess = ref(
    unref(isWashOrder) ? false : unref(status) === PAYMENT_STATUS.SUCCESS
  );
  // 开始洗车成功
  const machineStartSuccess = ref(false);
  // 是否正在检查
  const isChecking = ref(false);
  // 错误
  const error = ref(null);

  const orderNo = ref(null);

  const result = {
    isChecking,
    isWashOrder,
    status,
    success,
    paymentSuccess,
    machineStartSuccess,
    error,
    orderNo,
    ...route.query,
  };

  if (!useCheck) {
    // 不使用检查，直接返回
    return result;
  }

  const timeoutFnStopHandler = ref(null);

  // 检查支付结果
  const checkStatus = async () => {
    // 检查计时器超时...
    // if (!isPending.value) {
    //   return {
    //     status: PAYMENT_CHECK.STATUS.TIMEOUT,
    //   };
    // }

    if (isChecking.value) {
      return {
        status: PAYMENT_CHECK.STATUS.PENDING,
      };
    }

    isChecking.value = true;
    error.value = null;

    try {
      const { data, error: apiError } = await washApi.payResultCheck(oid);
      if (apiError.value) {
        error.value = apiError.value;
        return {
          status: PAYMENT_CHECK.STATUS.ERROR,
        };
      }

      const { isPaySuccess, isStartSuccess, timeout, orderNo: ono } = unref(data) || {};
      paymentSuccess.value = isPaySuccess;
      machineStartSuccess.value = isStartSuccess;
      const allDone = isPaySuccess && isStartSuccess;
      success.value = allDone;
      orderNo.value = ono;
      // 支付成功
      if (isPaySuccess) {
        return {
          status: PAYMENT_CHECK.STATUS.SUCCESS,
          washMachineStatus: isStartSuccess
            ? PAYMENT_CHECK.WASH_MACHINE_STATUS.SUCCESS
            : PAYMENT_CHECK.WASH_MACHINE_STATUS.ERROR,
        };
      }
      if (timeout) {
        const diff = timeout - Date.now();
        if (diff <= 0) {
          return {
            status: PAYMENT_CHECK.STATUS.TIMEOUT,
          };
        }
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      isChecking.value = false;
    }
  };

  const { isActive, pause } =
    useCheck &&
    useTimeoutPoll(
      async () => {
        try {
          const { status: checkedStatus, washMachineStatus } =
            await checkStatus();

          const paymentCheckSuccess =
            checkedStatus === PAYMENT_CHECK.STATUS.SUCCESS;
          const washMachineCheckSuccess =
            washMachineStatus === PAYMENT_CHECK.WASH_MACHINE_STATUS.SUCCESS;
          const paymentCheckTimeout =
            checkedStatus === PAYMENT_CHECK.STATUS.TIMEOUT;

          // const allDone = paymentCheckSuccess && washMachineCheckSuccess;
          // success.value = allDone;
          // 支付成功, 洗车机只启动一次.
          if (paymentCheckSuccess) {
            pause();
            timeoutFnStopHandler.value?.();
            status.value = PAYMENT_STATUS.SUCCESS;
          }

          if (paymentCheckTimeout) {
            pause();
            timeoutFnStopHandler.value?.();
            status.value = PAYMENT_STATUS.TIMEOUT;
          }
        } catch (error) {
          console.error("检查订单状态失败:", error);
        }
      },
      PAYMENT_CHECK.INTERVAL,
      { immediate: true }
    );

  // 支付结果检查计时器
  const { isPending, stop } = useTimeoutFn(
    () => {
      pause();
    },
    PAYMENT_CHECK.MAX_TIME,
    {
      immediate: true,
    }
  );
  // 保存 stop 函数
  timeoutFnStopHandler.value = stop;

  return {
    ...result,
    isActive,
  };
}

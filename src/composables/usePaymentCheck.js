import { washApi, vipCardApi, myPageApi } from "@/api";
import { PAYMENT_CHECK, PAYMENT_FROM, PAYMENT_STATUS } from "@/constants";
import { resolvePaymentStatus } from "@/utils/payment-status";

// Un estado que todavía no es definitivo: MP suele volver con `pending` /
// `in_process` (típico del pago con "dinero en cuenta") un instante antes de
// acreditar. Para VIP/recarga NO tratamos esto como fallo.
const isPendingStatus = (s) =>
  s === PAYMENT_STATUS.PENDING || s === PAYMENT_STATUS.PROCESSING;

// Cuántas veces reconsultamos la acreditación de un pago VIP/recarga que volvió
// en estado intermedio, y cada cuánto. ~5 intentos * 2s = 10s de margen, que
// alcanza para el retraso habitual del "dinero en cuenta" de Mercado Pago.
const NON_WASH_RECHECK_TRIES = 5;
const NON_WASH_RECHECK_INTERVAL = 2000;


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

  // Mientras confirmamos (VIP/recarga) la acreditación de un pago que volvió en
  // estado intermedio, la pantalla debe esperar antes de arrancar la cuenta
  // regresiva/redirección.
  const isRechecking = ref(false);

  const result = {
    isChecking,
    isWashOrder,
    isRechecking,
    status,
    success,
    paymentSuccess,
    machineStartSuccess,
    error,
    orderNo,
    ...route.query,
  };

  // Re-chequeo de pagos que NO son de lavado (VIP / recarga) que volvieron de
  // Mercado Pago en estado intermedio. El backend no expone un endpoint de
  // "estado del pago por oid" para estos, así que confirmamos la acreditación
  // de forma indirecta: tomamos un snapshot al montar (cantidad de tarjetas VIP
  // usables / saldo) y consultamos si cambió. Solo pasamos a `success` cuando
  // detectamos el cambio; si se agota el margen, dejamos el estado intermedio
  // (la pantalla muestra "Procesando…", no un fallo).
  const isVipCard = from === PAYMENT_FROM.VIP_CARD;
  const isTopUp = from === PAYMENT_FROM.TOP_UP;
  const recheckNonWash =
    hasSession &&
    !unref(isWashOrder) &&
    (isVipCard || isTopUp) &&
    isPendingStatus(unref(status));

  if (recheckNonWash) {
    const readSignal = async () => {
      try {
        if (isVipCard) {
          const { data } = await vipCardApi.myCardList({ canUseType: 1 });
          const list = unref(data);
          return Array.isArray(list) ? list.length : null;
        }
        const { data } = await myPageApi.myInfo();
        const info = unref(data);
        return info && info.balance != null ? Number(info.balance) : null;
      } catch {
        return null;
      }
    };

    isRechecking.value = true;
    (async () => {
      try {
        const baseline = await readSignal();
        // Sin línea de base no podemos comparar con confianza: dejamos el estado
        // intermedio tal cual (mejor "Procesando…" que un falso "listo").
        if (baseline == null) return;

        for (let i = 0; i < NON_WASH_RECHECK_TRIES; i++) {
          await new Promise((r) => setTimeout(r, NON_WASH_RECHECK_INTERVAL));
          // Si algo ya resolvió el estado mientras esperábamos, cortamos.
          if (!isPendingStatus(status.value)) return;

          const current = await readSignal();
          if (current != null && current > baseline) {
            paymentSuccess.value = true;
            success.value = true;
            status.value = PAYMENT_STATUS.SUCCESS;
            return;
          }
        }
      } finally {
        isRechecking.value = false;
      }
    })();
  }

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

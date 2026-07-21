import { PAYMENT_STATUS } from "@/constants";

export function usePaymentResult() {
  const router = useRouter();

  const { query } = useRoute();

  function getResultUrl(options) {
    const { oid = query.oid, from = query.from, method = query.method, status, stringify = false } = options;
    if (stringify) {
      const url = new URL("/payment/result", window.location.origin);
      oid && url.searchParams.set("oid", oid);
      from && url.searchParams.set("from", from);
      method && url.searchParams.set("method", method);
      status && url.searchParams.set("status", status);
      return url.toString();
    }

    return {
      path: "/payment/result",
      query: {
        oid,
        from,
        method,
        ...(status ? { status } : {}),
      },
    };
  }

  function success({ oid, from, method }) {
    // Éxito interno (pago con saldo / confirmación del backend): marcamos el
    // estado explícitamente para no depender de un query param de MP.
    router.replace(getResultUrl({
      oid,
      from,
      method,
      status: PAYMENT_STATUS.SUCCESS,
    }));
  }

  function fail({ oid, from, cancel, timeout }) {
    router.replace({
      path: "/payment/result",
      query: {
        oid,
        from,
        cancel,
        timeout,
      },
    });
  }

  return {
    success,
    fail,
    getResultUrl,
  };
}

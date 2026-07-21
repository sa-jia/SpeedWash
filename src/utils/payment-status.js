import { PAYMENT_STATUS } from "@/constants";

/**
 * Traduce los estados que devuelve Mercado Pago al volver a la app (en los
 * query params `status` / `collection_status` de la back_url) al vocabulario
 * interno de la app.
 *
 * MP usa `approved`, `pending`, `in_process`, `rejected`, ... mientras que la
 * app compara contra `success`, `pending`, `processing`, `fail`, ...
 *
 * El bug de "Pago fallido" con el pago acreditado venía de comparar
 * directamente `approved` (MP) contra `success` (app): nunca coincidían.
 * Confirmado con la redirección real de MP que termina en
 * `.../congrats/approved/` → el estado que llega es `approved`.
 *
 * Ref back_urls: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/checkout-customization/user-interface/redirection
 */
const MP_STATUS_MAP = {
  approved: PAYMENT_STATUS.SUCCESS,
  authorized: PAYMENT_STATUS.SUCCESS,
  pending: PAYMENT_STATUS.PENDING,
  in_process: PAYMENT_STATUS.PROCESSING,
  in_mediation: PAYMENT_STATUS.PROCESSING,
  rejected: PAYMENT_STATUS.FAIL,
  refunded: PAYMENT_STATUS.FAIL,
  charged_back: PAYMENT_STATUS.FAIL,
  failure: PAYMENT_STATUS.FAIL,
  cancelled: PAYMENT_STATUS.CANCELLED,
  canceled: PAYMENT_STATUS.CANCELLED,
};

// Valores que ya pertenecen al vocabulario interno de la app (p. ej. el pago
// con saldo navega directo a /payment/result?status=success sin pasar por MP).
const APP_STATUSES = new Set(Object.values(PAYMENT_STATUS));

/**
 * Normaliza un valor crudo de query param a un PAYMENT_STATUS, o `null` si no
 * hay un valor legible. Tolera arrays (vue-router colapsa claves repetidas en
 * array), mayúsculas/espacios y los "null"/"undefined" que MP manda como texto.
 *
 * @param {string|string[]|null|undefined} raw
 * @returns {string|null}
 */
function coerce(raw) {
  const value = Array.isArray(raw)
    ? raw.find((v) => v != null && v !== "")
    : raw;
  if (value == null) return null;

  const key = String(value).trim().toLowerCase();
  if (key === "" || key === "null" || key === "undefined") return null;

  if (APP_STATUSES.has(key)) return key;
  return MP_STATUS_MAP[key] ?? PAYMENT_STATUS.FAIL;
}

/**
 * Resuelve el estado de pago inicial para la pantalla /payment/result a partir
 * del `route.query`. Prioriza `status` y usa `collection_status` como respaldo
 * (MP suele mandar ambos con el mismo valor). Si nada es legible, queda en
 * PENDING (neutro).
 *
 * @param {Record<string, unknown>} query - route.query
 * @returns {string} un valor de PAYMENT_STATUS
 */
export function resolvePaymentStatus(query = {}) {
  return (
    coerce(query.status) ??
    coerce(query.collection_status) ??
    PAYMENT_STATUS.PENDING
  );
}

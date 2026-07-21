// Mapeo de mensajes en inglés/chino que devuelve el backend a strings
// localizados en español rioplatense. El backend del proveedor todavía
// devuelve algunos `msg` hardcoded en su idioma original; mientras se
// actualiza del lado server (ver CHANGELOG sección 2), interceptamos
// acá para que el usuario final no vea inglés ni chino.
//
// Se invoca desde la capa central useApi.js (afterFetch), así CUALQUIER
// llamada al backend devuelve el error ya traducido. Las pantallas
// individuales no necesitan tocarse.

import { i18n } from "@/modules/i18n";

const BACKEND_ERROR_MAP = [
  // Registro: número ya registrado
  {
    match: /cell phone number already exists|phone.*already.*exists|already.*registered/i,
    key: "errors.backend.phoneAlreadyExists",
  },
  // Login / recupero: número no registrado
  {
    match: /cell phone number is not yet registered|phone.*not.*registered|not.*yet.*registered/i,
    key: "errors.backend.phoneNotRegistered",
  },
  // Cambio de contraseña: passwords no coinciden
  {
    match: /code does not match|password.*not.*match|passwords.*do.*not.*match/i,
    key: "errors.backend.passwordMismatch",
  },
  // Contraseña incorrecta (login)
  {
    match: /incorrect password|wrong password|password.*incorrect/i,
    key: "errors.backend.passwordIncorrect",
  },
  // Código SMS inválido / expirado
  {
    match: /sms.*code.*invalid|verification code.*invalid|invalid.*verification|sms.*expired|code.*expired/i,
    key: "errors.backend.smsCodeInvalid",
  },
  // Falla al enviar el SMS (pasarela del backend). El proveedor devuelve
  // "SMS send fail" genérico; mostramos algo accionable en vez del genérico.
  {
    match: /sms send fail|send.*sms.*fail|fail.*send.*sms/i,
    key: "errors.backend.smsSendFail",
  },
  // Sesión expirada (chino + posibles variantes en inglés)
  {
    match: /未登录|登录已失效|not logged in|session expired|please login/i,
    key: "errors.backend.sessionExpired",
  },
  // Sin saldo suficiente
  {
    match: /insufficient balance|not enough balance|balance.*not enough/i,
    key: "errors.backend.insufficientBalance",
  },
  // Sin permisos
  {
    match: /no permission|forbidden|access denied/i,
    key: "errors.backend.forbidden",
  },
  // Recurso no encontrado
  {
    match: /not found|does not exist/i,
    key: "errors.backend.notFound",
  },
];

// Heurística: ¿el string parece ya estar en español?
// Si tiene caracteres acentuados o palabras típicas del español, lo
// dejamos pasar tal cual en vez de aplastarlo con el genérico.
function looksLikeSpanish(text) {
  return /[áéíóúñ¿¡]|\b(ingresá|contraseña|teléfono|código|sesión|cuenta)\b/i.test(
    text
  );
}

/**
 * Traduce un mensaje de error del backend al español. Si no hay match
 * y el texto no parece español, devuelve un mensaje genérico (no
 * exponemos inglés/chino al usuario).
 *
 * @param {unknown} error  El error o string que vino del backend.
 * @param {(key: string) => string} [t]  Opcional. Si no se pasa, se usa
 *   i18n.global.t directamente (útil desde fuera de componentes).
 * @returns {string} Mensaje en español listo para mostrar al usuario.
 */
export function translateBackendError(error, t) {
  const translate = t || i18n.global.t;
  const raw = String(error?.message ?? error ?? "").trim();
  if (!raw) return translate("errors.backend.unknown");

  for (const { match, key } of BACKEND_ERROR_MAP) {
    if (match.test(raw)) return translate(key);
  }

  // Si ya viene en español lo devolvemos tal cual (mensajes del propio
  // frontend que se rethrowan, validaciones de yup/zod, etc).
  if (looksLikeSpanish(raw)) return raw;

  // Dejamos el msg crudo del backend en consola para poder diagnosticar
  // desde el campo (el usuario solo ve el genérico, pero el dev lo ve acá).
  console.warn("[backendError] mensaje del backend sin mapear:", raw);

  // Fallback: genérico, NO el original (evita exponer inglés/chino).
  return translate("errors.backend.unknown");
}

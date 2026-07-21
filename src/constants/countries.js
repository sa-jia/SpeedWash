// Catálogo de países soportados para el campo de teléfono.
// Limitado a Argentina + países limítrofes (UY, CL, BR, PY).
// Cada país define:
//   - code: prefijo internacional sin el +
//   - iso: código ISO de 2 letras (texto, sin emoji — combina con la UI tech)
//   - i18nKey: key dentro de components.phoneNumberField.country.*
//   - minLength / maxLength: dígitos nacionales (sin código de área)
//   - pattern: regex que el número nacional debe matchear para considerarse válido
//
// Si más adelante se suma BO/PE/MX, agregarlos acá y traducir el i18nKey.

export const COUNTRIES = [
  {
    code: "54",
    iso: "AR",
    i18nKey: "argentina",
    minLength: 10,
    maxLength: 10,
    // 10 dígitos: 2-4 de área + 6-8 de abonado. Validamos rango.
    pattern: /^\d{10}$/,
  },
  {
    code: "598",
    iso: "UY",
    i18nKey: "uruguay",
    minLength: 8,
    maxLength: 9,
    // Móviles arrancan con 9; fijos con 2/4. 8-9 dígitos según operador.
    pattern: /^\d{8,9}$/,
  },
  {
    code: "56",
    iso: "CL",
    i18nKey: "chile",
    minLength: 9,
    maxLength: 9,
    // Móviles arrancan con 9 (9 + 8 dígitos = 9 dígitos).
    pattern: /^9\d{8}$|^\d{9}$/,
  },
  {
    code: "55",
    iso: "BR",
    i18nKey: "brasil",
    minLength: 10,
    maxLength: 11,
    // DDD 2 dígitos + número de 8 (fijo) o 9 (móvil, empieza con 9).
    pattern: /^\d{10,11}$/,
  },
  {
    code: "595",
    iso: "PY",
    i18nKey: "paraguay",
    minLength: 9,
    maxLength: 9,
    // Móviles 9 dígitos (9 + 8 dígitos).
    pattern: /^9\d{8}$|^\d{9}$/,
  },
];

// Helper para buscar por código de área. Devuelve AR por default.
export function getCountryByCode(code) {
  const target = String(code);
  return COUNTRIES.find((c) => c.code === target) || COUNTRIES[0];
}

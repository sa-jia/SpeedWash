export function getBrowserLanguage() {
  return (navigator.language || navigator.userLanguage).toLowerCase();
}

export function isZh() {
  const lang = getBrowserLanguage();
  return lang.startsWith("zh");
}

export function isEs() {
  const lang = getBrowserLanguage();
  return lang.startsWith("es");
}

export function getLocale() {
  if (isEs()) return "ES";
  if (isZh()) return "CN";
  return "ES";
}

export function getLocaleCode() {
  if (isEs()) return "es-AR";
  if (isZh()) return "zh-CN";
  return "es-AR";
}

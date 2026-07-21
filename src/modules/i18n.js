import { Locale } from "vant";
// 引入英文语言包
import enUSPackage from "vant/es/locale/lang/en-US";
import zhCNPackage from "vant/es/locale/lang/zh-CN";
import esESPackage from "vant/es/locale/lang/es-ES";
import { createI18n } from "vue-i18n";
import { isZh, isEs, getBrowserLanguage, getLocaleCode } from "@/utils";
import en from "~i18n/en.json";
import zhCN from "~i18n/zh-CN.json";
import esAR from "~i18n/es-AR.json";

// 获取浏览器语言
// export function getBrowserLanguage() {
//   const lang = (navigator.language || navigator.userLanguage).toLowerCase();
//   if (isZh()) {
//     return "zh-CN";
//   }
//   return "en"
// }

// 获取多层目录结构
const files = import.meta.glob([
  "/locales/*/*.json", // 一级目录
  "/locales/**/*.json", // 二级目录
]);

const _localesMap = Object.fromEntries(
  Object.entries(files)
    .map(([path, loadLocale]) => [path.match(/([\w-]*)\.json$/)?.[1], loadLocale]),
)

// const localesMap = Object.fromEntries(
//   Object.entries(import.meta.glob('../../locales/*.yml'))
//     .map(([path, loadLocale]) => [path.match(/([\w-]*)\.yml$/)?.[1], loadLocale]),
// ) as Record<Locale, () => Promise<{ default: Record<string, string> }>>

const localesMap = {
  "es-AR": () => import("~i18n/es-AR.json"),
  "zh-CN": () => import("~i18n/zh-CN.json"),
  "en-US": () => import("~i18n/en.json"),
}

// 整理成目录结构
// const localesMap = Object.fromEntries(
//   Object.entries(files)
//     .map(([path, loadLocale]) => {
//       const [, , lang, ...rest] = path.split("/");
//       if (lang === "zh-CN.json" || lang === "en.json") {
//         return null;
//       }
//       const key = lang;
//       const value = () =>
//         loadLocale().then((module) => {
//           const nestedPath = rest.join("/");
//           return { [nestedPath]: module.default };
//         });
//       return [key, value];
//     })
//     .filter(Boolean)
// );

// 过滤到 zh-CN.json 和 en.json
export const availableLocales = Object.keys(localesMap).filter(
  (lang) => lang !== "zh-CN.json" && lang !== "en.json"
);

const loadedLanguages = [];

// 创建 i18n 实例
export const i18n = createI18n({
  legacy: false,
  locale: "",
  messages: {},
  fallbackLocale: "es-AR",
});

// 导出一个切换语言的工具函数
export function setI18nLanguage(lang) {
  i18n.global.locale.value = lang;
  if (typeof document !== "undefined")
    document.querySelector("html")?.setAttribute("lang", lang);
  return lang;
}

export async function loadLanguageAsync(lang) {
  // If the same language
  if (i18n.global.locale.value === lang) return setI18nLanguage(lang);

  // If the language was already loaded
  if (loadedLanguages.includes(lang)) return setI18nLanguage(lang);

  // If the language hasn't been loaded yet
  const messages = await localesMap[lang]();
  const { default: messagesDefault, ...messagesRest } = messages;
  i18n.global.setLocaleMessage(lang, messagesRest);
  // Vant no tiene es-AR: para español usamos su pack es-ES (botones
  // "Confirmar"/"Cancelar", etc.); chino → zh-CN; resto → en-US.
  Locale.use(lang, isZh() ? zhCNPackage : isEs() ? esESPackage : enUSPackage);
  loadedLanguages.push(lang);
  return setI18nLanguage(lang);
}

export const install = ({ app }) => {
  app.use(i18n);
  loadLanguageAsync(getLocaleCode());
};

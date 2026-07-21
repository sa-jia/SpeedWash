import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  transformerDirectives,
} from "unocss";

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  theme: {
    // breakpoints: {
    //   sm: "640px",
    //   md: "768px",
    //   lg: "1024px",
    //   xl: "1280px",
    //   "2xl": "1536px",
    // },
    colors: {
      primary: "#00BBFC",
      "primary-dark": "#0090CC",
      "primary-light": "#5ED2FD",
      accent: "#FF9416",
      "accent-light": "#FFB04D",
      success: "#00D97E",
      error: "#F04438",
      secondary: "#ACACB6",
      ink: "#000000",
      background: "#000000",
      surface: "#141418",
      "surface-2": "#1B1B20",
      line: "#232328",
      "text-primary": "#F4F4F6",
      "text-secondary": "#ACACB6",
      "text-dim": "#6B6B73",
      dark: "#0B0B0D",
    },
    animation: {
      keyframes: {
        expand:
          "{0%{transform:translate(-50%,-50%) scale(0)}100%{transform:translate(-50%,-50%) scale(1)}}",
        glow: "{0%{transform:translate(-50%,-50%) scale(1);opacity:0.5}50%{transform:translate(-50%,-50%) scale(1.2);opacity:0.3}100%{transform:translate(-50%,-50%) scale(1);opacity:0.5}}",
      },
      durations: {
        expand: "0.5s",
        glow: "2s",
      },
      timingFns: {
        expand: "ease-out",
        glow: "ease-out",
      },
      counts: {
        glow: "infinite",
      },
    },
  },
  rules: [
    ['h-default', { height: 'calc(100vh - var(--van-nav-bar-height) - env(safe-area-inset-top))' }],
    // 响应式单位规则
    [
      /^text-([\.\d]+)$/,
      ([_, num]) => ({ "font-size": `calc(${num} * var(--vw))` }),
    ],
    [/^w-([\.\d]+)$/, ([_, num]) => ({ width: `calc(${num} * var(--vw))` })],
    [/^h-([\.\d]+)$/, ([_, num]) => ({ height: `calc(${num} * var(--vw))` })],
    [
      /^lh-([\.\d]+)$/,
      ([_, num]) => ({ "line-height": `calc(${num} * var(--vw))` }),
    ],
    [
      /^mt-([\.\d]+)$/,
      ([_, num]) => ({ "margin-top": `calc(${num} * var(--vw))` }),
    ],
    [
      /^mb-([\.\d]+)$/,
      ([_, num]) => ({ "margin-bottom": `calc(${num} * var(--vw))` }),
    ],
    [
      /^ml-([\.\d]+)$/,
      ([_, num]) => ({ "margin-left": `calc(${num} * var(--vw))` }),
    ],
    [
      /^mr-([\.\d]+)$/,
      ([_, num]) => ({ "margin-right": `calc(${num} * var(--vw))` }),
    ],
    [
      /^pt-([\.\d]+)$/,
      ([_, num]) => ({ "padding-top": `calc(${num} * var(--vw))` }),
    ],
    [
      /^pb-([\.\d]+)$/,
      ([_, num]) => ({ "padding-bottom": `calc(${num} * var(--vw))` }),
    ],
    [
      /^pl-([\.\d]+)$/,
      ([_, num]) => ({ "padding-left": `calc(${num} * var(--vw))` }),
    ],
    [
      /^pr-([\.\d]+)$/,
      ([_, num]) => ({ "padding-right": `calc(${num} * var(--vw))` }),
    ],
    // 安全区域相关
    [
      "pb-safe",
      {
        "padding-bottom": "constant(safe-area-inset-bottom)",
        "padding-bottom": "env(safe-area-inset-bottom)",
      },
    ],
    // safe-area-inset-bottom 相关
    [
      /^bottom-safe-(\d+)$/,
      ([_, num]) => ({
        bottom: `calc(env(safe-area-inset-bottom) + ${num}px)`,
      }),
    ],
    // safe-area-inset-bottom + tabbar 相关
    [
      /^bottom-tabbar-(\d+)$/,
      ([_, num]) => ({
        bottom: `calc(env(safe-area-inset-bottom) + var(--van-tabbar-height) + ${num}px)`,
      }),
    ],
    [
      /^pb-safe-(\d+)$/,
      ([_, num]) => ({
        "padding-bottom": `calc(env(safe-area-inset-bottom) + ${num}px)`,
      }),
    ],
  ],
  shortcuts: {
    "payment-animation-base":
      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "flex-center": "flex items-center justify-center",
    "grid-center": "grid place-items-center",
    "absolute-center":
      "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2",
    "gradient-bg":
      "bg-gradient-to-b from-[#0B0B0D] from-0% via-[#080809] via-40% to-[#000000] to-100%",

    "card": "bg-surface b-1 b-solid b-line rounded-2xl",
    "normal-card": "b-2 b-rd-lg b-solid b-line bg-surface",
    "selected-card": "b-primary bg-primary/10",
    "disable-card": "opacity-50 pointer-events-none select-none cursor-not-allowed bg-surface-2",
    clickable:
      "cursor-pointer bg-surface-2/80 active:(opacity-70 scale-98) transition-all duration-200 select-none",

    "pb-safe-bottom": "pb-safe-80",
  },
  transformers: [transformerDirectives()],
});
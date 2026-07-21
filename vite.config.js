import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { VantResolver } from "@vant/auto-import-resolver";
import UnoCSS from "unocss/vite";
import svgLoader from "vite-svg-loader";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      // targets to transform
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
      ],

      // global imports to register
      imports: [
        // presets
        "vue",
        "vue-router",
        {
          "vue-i18n": ["useI18n"],
        },
        "@vueuse/core",
        // example type import
        {
          from: "vue-router",
          imports: ["RouteLocationRaw"],
          type: true,
        },
        "pinia",
      ],

      // Array of strings of regexes that contains imports meant to be filtered out.
      ignore: ["useMouse", "useFetch"],

      // Enable auto import by filename for default module exports under directories
      defaultExportByFilename: false,

      // Auto import for module exports under directories
      // by default it only scan one level of modules under the directory
      dirs: ["src/composables/**", "src/stores", "src/api"],

      // Filepath to generate corresponding .d.ts file.
      // Defaults to './auto-imports.d.ts' when `typescript` is installed locally.
      // Set `false` to disable.
      dts: "./auto-imports.d.ts",

      // Array of strings of regexes that contains imports meant to be ignored during
      // the declaration file generation. You may find this useful when you need to provide
      // a custom signature for a function.
      ignoreDts: ["ignoredFunction", /^ignore_/],

      // Auto import inside Vue template
      // see https://github.com/unjs/unimport/pull/15 and https://github.com/unjs/unimport/pull/72
      vueTemplate: true,

      // Auto import directives inside Vue template
      // see https://github.com/unjs/unimport/pull/374
      vueDirectives: undefined,

      // Custom resolvers, compatible with `unplugin-vue-components`
      // see https://github.com/antfu/unplugin-auto-import/pull/23/
      resolvers: [VantResolver()],

      // Include auto-imported packages in Vite's `optimizeDeps` options
      // Recommend to enable
      viteOptimizeDeps: true,

      // Inject the imports at the end of other imports
      injectAtEnd: true,

      // Generate corresponding .eslintrc-auto-import.json file.
      // eslint globals Docs - https://eslint.org/docs/user-guide/configuring/language-options#specifying-globals
      eslintrc: {
        enabled: true, // Default `false`
        // provide path ending with `.mjs` or `.cjs` to generate the file with the respective format
        filepath: "./.eslintrc-auto-import.json", // Default `./.eslintrc-auto-import.json`
        globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      },

      // Generate corresponding .biomelintrc-auto-import.json file.
      // biomejs extends Docs - https://biomejs.dev/guides/how-biome-works/#the-extends-option
      biomelintrc: {
        enabled: true, // Default `false`
        filepath: "./.biomelintrc-auto-import.json", // Default `./.biomelintrc-auto-import.json`
      },
    }),
    Components({
      dirs: ["src/components"],
      extensions: ["vue"],
      include: [/\.vue$/, /\.vue\?vue/],
      resolvers: [VantResolver()],
      dts: true,
    }),
    UnoCSS(),
    svgLoader({
      svgoConfig: {
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                removeViewBox: false, // 这是 preset-default 的一部分
              },
            },
          },
          {
            name: "cleanupIds",
            active: false,
          },
        ],
      },
    }),
    // VitePWA({
    //   registerType: "autoUpdate",
    //   includeAssets: ["favicon.svg", "safari-pinned-tab.svg"],
    //   manifest: {
    //     name: "Singapore",
    //     short_name: "Singapore",
    //     theme_color: "#ffffff",
    //     icons: [
    //       {
    //         src: "/pwa-192x192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/pwa-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/pwa-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //         purpose: "any maskable",
    //       },
    //     ],
    //   },
    // }),
    basicSsl({
      name: "test",
    }),
  ],
  resolve: {
    alias: {
      "~i18n": path.resolve(__dirname, "locales"),
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@router": path.resolve(__dirname, "src/router"),
      "@store": path.resolve(__dirname, "src/store"),
      "@utils": path.resolve(__dirname, "src/utils"),
    },
  },
  server: {
    https: false,
    proxy: {
      // Mismo camino que producción: el nginx de lavar.speedwash.com.ar
      // proxea /api → backend real (argentina-user.cheyoudaren.com/api).
      // La app llama /api/user/... (baseUrl default "/api" en useApi.js).
      // Antes había dos proxies (/api → backend de test amaze-ventures y
      // /user → backend real); se unificó para que dev y prod usen la
      // misma ruta.
      "/api": {
        target: "https://argentina-user.cheyoudaren.com",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import 'modern-normalize';
import "virtual:uno.css";
import "./styles/main.css";

const app = createApp(App);

// vConsole solo en dev. Dynamic import para que el bundle de producción
// no incluya la librería (Vite lo trata como dead-code y lo excluye).
if (import.meta.env.DEV) {
  import("vconsole").then(({ default: VConsole }) => new VConsole());
}

const ctx = {
  app,
  router,
};

// 安装所有模块
Object.values(import.meta.glob('./modules/*.js', { eager: true }))
  .forEach(i => i.install?.(ctx))
app.mount("#app");

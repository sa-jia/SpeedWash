<template>
  <barcode-scanner @success="onScanSuccess" @error="onScanError" />
</template>

<script setup>
const router = useRouter();
const { t } = useI18n();

// Rutas propias que un QR puede abrir. El QR de una máquina apunta a
// /washer/:id, pero el host impreso puede no ser el actual (dominio viejo,
// acortador que redirige), así que también matcheamos por path.
const APP_QR_PATHS = /^\/(washer|store|invite)\/[^/]+\/?$/;

// Dominios de Speed Wash: un QR de estos es nuestro aunque la ruta no exista
// en esta app (puede ser el sitio institucional o un redirect del server).
const OWN_HOSTS = /(^|\.)speedwash\.com\.ar$/i;

// Texto plano de un QR de máquina: "3", "machine3", "washer-3", "maquina 3".
const PLAIN_MACHINE = /^(?:machine|washer|maquina|máquina)?[\s._-]*(\d+)$/i;

// Solo navegamos a rutas que existen: un router.replace() a un path sin
// match no renderiza nada y la pantalla queda colgada en el frame congelado.
const resolveInApp = (path) => {
  const resolved = router.resolve(path);
  return resolved.matched.length ? resolved.fullPath : null;
};

// Contenido que no sabemos abrir → pantalla de resultado con aviso de
// seguridad, que además ofrece "Escanear de nuevo".
const showRawResult = (text) => {
  router.replace({ path: "/scan-result", query: { result: text } });
};

// 扫描成功处理
const onScanSuccess = ({ text }) => {
  const raw = (text || "").trim();

  if (!raw) {
    showToast(t("routes.scan.invalidResult"));
    return;
  }

  let url = null;
  try {
    url = new URL(raw);
  } catch {
    url = null;
  }

  if (url) {
    // 后台地址：salimos de la SPA a mano
    const backgroundUrl = import.meta.env.VITE_BACKGROUND_URL;
    if (backgroundUrl && url.origin === backgroundUrl) {
      window.location.href = url.href;
      return;
    }

    // QR nuestro: navegamos dentro de la app en vez de recargar, así el
    // beforeEnter de /washer/:id (mapeo de QR viejos) sigue aplicando.
    const isSameOrigin = url.origin === window.location.origin;
    if (isSameOrigin || APP_QR_PATHS.test(url.pathname)) {
      const target = resolveInApp(url.pathname + url.search + url.hash);
      if (target) {
        router.replace(target);
        return;
      }
    }

    // Host propio pero ruta que esta app no conoce (sitio institucional, un
    // acortador que redirige por HTTP): salimos de la SPA y que el server
    // resuelva. Same-origin no entra acá: recargar daría la misma ruta muerta.
    if (!isSameOrigin && OWN_HOSTS.test(url.hostname)) {
      window.location.href = url.href;
      return;
    }

    showRawResult(raw);
    return;
  }

  const machine = raw.match(PLAIN_MACHINE);
  if (machine) {
    const target = resolveInApp(`/washer/${machine[1]}`);
    if (target) {
      router.replace(target);
      return;
    }
  }

  showRawResult(raw);
};

// 扫描失败处理
const onScanError = (error) => {
  console.error("Scan error:", error);
  showToast(t("routes.scan.scanFailed"));
};
</script>

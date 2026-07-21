export const install = ({ app, router }) => {
  // 路由守卫保持不变
  // 可见
  const isVisiblePages = ["", "Home", "Scan", "Map", "Home", "Login", "Register", "Invite", "ForgotPassword"];

  // Rutas que requieren cuenta real (token), no sirve el guestId: comprar
  // packs, ver abonos y la billetera. Un invitado que intente entrar acá se
  // redirige a login con el mensaje "necesitás cuenta" (login-page lo muestra
  // vía isPurchaseFlow), en vez de dejar que el backend tire 999 → "sesión
  // expirada", que confunde porque el invitado nunca tuvo sesión.
  const requiresAccountPages = ["Vip", "Vouchers", "Wallet", "WalletTopUp", "WalletBalance"];

  router.beforeEach((to, from) => {
    const guestId = localStorage.getItem("guestId");
    const token = localStorage.getItem("token");

    const isVisible = isVisiblePages.includes(to.name);

    if (isVisible) {
      return true;
    }

    // Sin token (invitado o deslogueado) intentando una ruta de compra.
    if (!token && requiresAccountPages.includes(to.name)) {
      return {
        name: "Login",
        query: {
          redirect: to.fullPath,
        },
      };
    }

    if (!token && !guestId && to.name !== "Login") {
      return {
        name: "Login",
        query: {
          redirect: to.fullPath,
        },
      };
    }
    return true;
  });
  app.use(router);
};

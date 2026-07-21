import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/default.vue'

const routes = [
  {
    path: "/",
    component: DefaultLayout,
    children: [
      {
        path: "",
        redirect: "/home",
      },
      // Tabbar 页面
      {
        path: "/home",
        name: "Home",
        component: () => import("@/pages/home-page.vue"),
        meta: {
          titleKey: "routes.home.title",
          showTabbar: true,
          hideBackToHome: true,
          hideBackArrow: true,
        },
      },
      {
        path: "/map",
        name: "Map",
        component: () => import("@/pages/map/index.vue"),
        meta: {
          titleKey: "routes.map.title",
        },
      },
      {
        path: "/mine",
        name: "Mine",
        component: () => import("@/pages/mine-page.vue"),
        meta: {
          titleKey: "routes.mine.title",
          showTabbar: true,
          gradientBg: true,
        },
      },
      // 身份相关页面
      {
        path: "/identity",
        name: "Identity",
        component: () => import("@/pages/mine/identity.vue"),
        meta: {
          titleKey: "routes.identity.title",
        },
      },
      {
        path: "/verify",
        name: "Verify",
        component: () => import("@/pages/mine/verify.vue"),
        meta: {
          titleKey: "routes.verify.title",
        },
      },
      // 钱包相关页面
      {
        path: "/wallet",
        name: "Wallet",
        component: () => import("@/pages/wallet/index.vue"),
        meta: {
          titleKey: "routes.wallet.index.title",
          gradientBg: true,
        },
      },
      {
        path: "/wallet/top-up",
        name: "WalletTopUp",
        component: () => import("@/pages/wallet/top-up.vue"),
        meta: {
          titleKey: "routes.wallet.topUp.title",
        },
      },
      {
        path: "/wallet/balance",
        name: "WalletBalance",
        component: () => import("@/pages/wallet/balance.vue"),
        meta: {
          titleKey: "routes.wallet.balance.title",
        },
      },
      // 设置相关页面
      {
        path: "/settings",
        name: "Settings",
        component: () => import("@/pages/settings/index.vue"),
        meta: {
          titleKey: "routes.settings.index.title",
        },
      },
      {
        path: "/settings/nickname",
        name: "SettingsNickname",
        component: () => import("@/pages/settings/nickname.vue"),
        meta: {
          titleKey: "routes.settings.nickname.title",
        },
      },
      {
        path: "/settings/change-password",
        name: "SettingsChangePassword",
        component: () => import("@/pages/settings/change-password.vue"),
        meta: {
          titleKey: "routes.settings.changePassword.title",
        },
      },
      // 订单相关页面
      {
        path: "/orders",
        name: "Orders",
        component: () => import("@/pages/order/index.vue"),
        meta: {
          titleKey: "routes.order.index.title",
        },
      },
      {
        path: "/order/:id",
        name: "OrderDetail",
        component: () => import("@/pages/order/detail.vue"),
        meta: {
          titleKey: "routes.order.detail.title",
        },
      },
      {
        path: "/order/payment",
        name: "OrderPayment",
        component: () => import("@/pages/order/payment.vue"),
        meta: {
          titleKey: "routes.order.payment.title",
        },
      },
      // Rutas de reembolso desactivadas: el flujo se maneja por WhatsApp
      // (modelo manual hasta apertura — nadie mira el panel de refunds del
      // backend, y las fotos no llegan bien porque VITE_IMAGE_BASE_URL no
      // está definido → path guardado como "undefined/file/..."). Dejamos
      // los archivos por si el proveedor los actualiza en un update.
      // {
      //   path: "/order/refund/:id",
      //   name: "OrderRefund",
      //   component: () => import("@/pages/order/refund/index.vue"),
      //   meta: { titleKey: "routes.order.refund.title" },
      // },
      // {
      //   path: "/order/refund-detail/:id",
      //   name: "OrderRefundDetail",
      //   component: () => import("@/pages/order/refund/detail.vue"),
      //   meta: { titleKey: "routes.order.refund.detail.title" },
      // },
      // 洗车机详情
      {
        path: "/washer/:id",
        name: "WasherDetail",
        component: () => import("@/pages/washer/index.vue"),
        meta: {
          titleKey: "routes.washer.title",
        },
        // Redirección de IDs de QR ya impresos → ID real de la máquina.
        // Los primeros QR se imprimieron con /washer/1 y /washer/2, pero las
        // máquinas quedaron con iotId 3 y 4. Mapeamos para no reimprimir.
        // Al reimprimir con el ID real, se puede sacar la entrada del mapa.
        beforeEnter: (to) => {
          const LEGACY_QR_IDS = { 1: "3", 2: "4" };
          const realId = LEGACY_QR_IDS[to.params.id];
          if (realId) {
            return { name: "WasherDetail", params: { id: realId }, query: to.query };
          }
        },
      },
      // 登录相关页面
      {
        path: "/login/:code?",
        name: "Login",
        component: () => import("@/pages/login-page.vue"),
        meta: {
          titleKey: "routes.login.title",
          // El guard de auth redirige acá desde páginas protegidas:
          // un back() normal rebotaría contra el guard y no iría a
          // ningún lado, así que la flecha vuelve a la home.
          backTo: "/home",
        },
      },
      {
        path: "/register",
        name: "Register",
        component: () => import("@/pages/register-page.vue"),
        meta: {
          titleKey: "routes.register.title",
        },
      },
      {
        path: "/forgot-password",
        name: "ForgotPassword",
        component: () => import("@/pages/forgot-password-page.vue"),
        meta: {
          titleKey: "routes.forgotPassword.title",
        },
      },
      // 其他独立页面
      {
        path: "/vip",
        name: "Vip",
        component: () => import("@/pages/membership/index.vue"),
        meta: {
          titleKey: "routes.membership.title",
        },
      },
      {
        path: "/vouchers",
        name: "Vouchers",
        component: () => import("@/pages/voucher/index.vue"),
        meta: {
          titleKey: "routes.vouchers.title",
        },
      },
      {
        path: "/store/:id",
        name: "StoreDetail",
        component: () => import("@/pages/store/index.vue"),
        meta: {
          titleKey: "routes.store.detail.title",
        },
      },
      {
        path: "/payment/result/:id(\\d+)?",
        name: "PaymentResult",
        component: () => import("@/pages/payment/result.vue"),
        meta: {
          titleKey: "routes.payment.result.title",
        },
      },
      {
        path: "/scan-result",
        name: "ScanResult",
        component: () => import("@/pages/scan-result.vue"),
        meta: {
          titleKey: "routes.scan.result.title",
        },
      },
      {
        path: "/invite/:code",
        name: "Invite",
        component: () => import("@/pages/invite/index.vue"),
        meta: {
          titleKey: "routes.invite.title",
        },
      },
      {
        path: "/invite/rewards",
        name: "InviteRewards",
        component: () => import("@/pages/invite/rewards.vue"),
        meta: {
          titleKey: "routes.invite.rewards.title",
        },
      },
      {
        path: "/invite/redeem",
        name: "InviteRedeem",
        component: () => import("@/pages/invite/redeem.vue"),
        meta: {
          titleKey: "routes.invite.redeem.title",
        },
      },
      {
        path: "/invite/record",
        name: "InviteRecord",
        component: () => import("@/pages/invite/record.vue"),
        meta: {
          titleKey: "routes.invite.record.title",
        },
      },
      {
        path: "/settings/aboutus",
        name: "SettingsAboutus",
        component: () => import("@/pages/settings/aboutus.vue"),
        meta: {
          titleKey: "routes.settings.aboutus.title",
        },
      },
    ],
  },
  {
    path: "/scan",
    name: "Scan",
    component: () => import("@/pages/scan-page.vue"),
    meta: {
      titleKey: "routes.scan.title",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 
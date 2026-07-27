<script setup>
const router = useRouter();
const userStore = useUserStore();
const { t } = useI18n();

// 获取 redirectUrl
const { query } = useRoute();
const redirectUrl = computed(() => query.redirect || "/");

// Rutas que requieren cuenta real (no funcionan con guestId).
// Si el usuario aterrizó en /login por una de estas, ocultamos el botón
// "Continuar como invitado" para evitar el loop de redirección.
const PURCHASE_PATHS = ["/vip", "/vouchers", "/wallet"];
const isPurchaseFlow = computed(() => {
  const redirect = String(query.redirect || "");
  return PURCHASE_PATHS.some((p) => redirect.startsWith(p));
});

const {
  areaCode,
  formData,
  phoneNumber,
  formRef,
  phoneRules,
  passwordRules,
} = useAuth();

// 设置默认值
// formData.value.phone = "90093215";
// formData.value.password = "222222";

// 登录提交
const onSubmit = async () => {
  try {
    const { data, error } = await loginApi.pwdLogin({
      phoneNum: phoneNumber.value,
      pwd: formData.value.password,
    });

    if (unref(error)) {
      showToast(unref(error));
      return;
    }

    // 保存登录状态
    const { token, phoneNum, nickName } = unref(data);
    userStore.setUserInfo({
      token,
      phoneNum,
      nickName,
    });

    showToast(t("routes.login.success"));
    router.replace(redirectUrl.value);
  } catch (err) {
    console.error("登录失败:", err);
    showToast(err?.message || t("routes.login.failed"));
  }
};

// 访客登录
const guestLogin = () => {
  userStore.guestLogin();
  showToast(t("routes.login.guestLoginSuccess"));
  router.replace(redirectUrl.value);
};
</script>

<template>
  <van-space direction="vertical" fill class="z-10 relative login-screen">
    <!-- Isotipo Speed Wash, mismo tratamiento que /register -->
    <div class="flex justify-center items-center w-full pb-6">
      <img
        src="@/assets/speedwash-iso.png"
        alt="Speed Wash"
        class="block h-60px w-auto"
      />
    </div>

    <van-form @submit="onSubmit" ref="formRef">
      <!-- 表单区域 -->
      <van-cell-group inset class="form-wells">
        <!-- 手机号输入框 -->
        <phone-number-field v-model="formData.phone" name="phone" :rules="phoneRules" v-model:area-code="areaCode" />

        <!-- 密码输入框 -->
        <password-field v-model="formData.password" name="password"
          :placeholder="t('routes.login.passwordPlaceholder')" :rules="passwordRules" />
      </van-cell-group>

      <!-- 登录按钮 -->
      <van-cell-group inset class="!mt-20px">
        <van-button round block type="primary" class="text-16px bg-primary" native-type="submit">
          {{ t('routes.login.submit') }}
        </van-button>
      </van-cell-group>
    </van-form>

    <!-- Crear cuenta nueva — destacado como CTA secundario (outline).
         La mayoría de los usuarios todavía no tiene cuenta, así que
         queremos que el alta sea fácil de encontrar. Temporal: cuando la
         base ya tenga cuenta, volver a degradarlo a text link. -->
    <van-cell-group inset class="!mt-12px">
      <router-link to="/register" class="block">
        <van-button round block class="text-16px register-cta">
          {{ t('routes.login.register') }}
        </van-button>
      </router-link>
    </van-cell-group>

    <!-- Links secundarios: olvidé contraseña / invitado.
         "Invitado" se oculta si el redirect es a un flujo que necesita
         cuenta real (compra de pack, billetera). -->
    <div class="flex flex-wrap justify-center items-center gap-x-4 gap-y-3 min-h-44px px-4 text-26 font-medium">
      <router-link to="/forgot-password" class="!text-white">{{ t('routes.login.forgotPassword') }}</router-link>
      <template v-if="!isPurchaseFlow">
        <div class="w-2 h-28 bg-white/30"></div>
        <button
          type="button"
          class="!text-white text-26 font-medium bg-transparent border-none p-0 cursor-pointer"
          @click="guestLogin"
        >
          {{ t('routes.login.guestLogin') }}
        </button>
      </template>
    </div>

    <div v-if="isPurchaseFlow" class="mx-30 mt-20 rounded-2xl border border-white/15 bg-white/5 px-24 py-20 text-center backdrop-blur-sm">
      <div class="text-white/85 text-22 leading-relaxed">
        {{ t('routes.login.purchaseRequiresAccount') }}
      </div>
    </div>
  </van-space>
</template>

<style scoped>
:deep(.van-field__label) {
  width: auto;
}

/* Centrado vertical: la pantalla quedaba pegada arriba con la mitad
   inferior vacía. Ocupamos el alto disponible bajo el navbar y centramos
   logo + form + links como un solo bloque. */
.login-screen {
  min-height: calc(100vh - 46px - env(safe-area-inset-top));
  min-height: calc(100dvh - 46px - env(safe-area-inset-top));
  justify-content: center;
}

/* CTA secundario "Crear cuenta nueva": outline azul, claramente un botón
   pero subordinado al "Ingresar" lleno de arriba. */
.register-cta {
  background: rgba(0, 187, 252, 0.08);
  border: 1px solid rgba(0, 187, 252, 0.55);
  color: #00BBFC;
  font-weight: 700;
}
</style>

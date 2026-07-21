<script setup>
import { getCountryByCode } from "@/constants/countries";

const router = useRouter();
const { t } = useI18n();

const userStore = useUserStore();

const { query } = useRoute();
const { inviteCode } = query;

const {
  areaCode,
  phoneNumber,
  formData,
  getVerifyCode,
  smsRequestId,
  isActive,
  agreement,
  formRef,
  phoneRules,
  verifyCodeRules,
  passwordRules,
  confirmPasswordRules,
  countdownButtonText,
} = useAuth(smsApi.regedit);

formData.value.inviteCode = inviteCode;

const { data, error } = loginApi.getSysVal("USER_SERVICE_CONTRACT")

const loading = ref(false); // 提交loading

// ── UX del flujo de registro ────────────────────────────────────────────
// El usuario tiene que entender: 1° pedir código, 2° completar datos.
// Habilitamos el bloque 2 solo cuando el SMS ya fue solicitado.
const codeSent = computed(() => !!smsRequestId.value);

// Validación local para habilitar el botón "Enviarme código" sin disparar
// las rules de van-form (que pintarían el input de rojo).
// Aplica el regex del país seleccionado (AR es /^\d{10}$/, etc).
const isPhoneValid = computed(() => {
  const digits = String(formData.value.phone || "").replace(/\D/g, "");
  const country = getCountryByCode(areaCode.value);
  return country.pattern.test(digits);
});

// Mostrar el teléfono formateado en el aviso "Te enviamos un código a…".
const phoneDisplay = computed(() => {
  const raw = String(formData.value.phone || "").replace(/\D/g, "");
  if (raw.length < 8) return `+${areaCode.value} ${raw}`;
  // ej. 3411234567 → 341 123 4567
  const head = raw.slice(0, raw.length - 7);
  const mid = raw.slice(-7, -4);
  const tail = raw.slice(-4);
  return `+${areaCode.value} ${head} ${mid} ${tail}`;
});

// Campo de invitación: solo visible si vino por URL o si el usuario lo abre.
const showInviteField = ref(!!inviteCode);

// 提交表单
const onSubmit = async () => {
  if (loading.value) return;
  loading.value = true;

  try {
    const { data, error } = await loginApi.regedit({
      phoneNum: phoneNumber.value,
      smsCode: formData.value.verifyCode,
      pwd: formData.value.password,
      smsRequestId: smsRequestId.value,
      inviteKey: formData.value.inviteCode,
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

    showToast(t("routes.register.success"));

    if (formData.value.inviteCode) {
      router.replace('/invite/redeem');
    } else {
      router.replace('/');
    }
  } catch (err) {
    console.error("Register error:", err);
    showToast(t("routes.register.failed"));
  } finally {
    loading.value = false;
  }
};

// 显示用户协议
const showAgreement = () => {
  showDialog({
    title: t("routes.register.agreementTitle"),
    allowHtml: true,
    message: data.value.val,
    confirmButtonText: t("routes.register.agreementConfirm"),
  })
  .then(() => {
    agreement.value = true;
  });
};

// 跳转登录页
const goToLogin = () => {
  router.push("/login");
};
</script>
<template>
  <!-- Isotipo Speed Wash — cuadrado, deja respirar al form de 2 pasos -->
  <div class="pt-8 pb-4 text-center">
    <img
      src="@/assets/speedwash-iso.png"
      alt="Speed Wash"
      class="mx-auto block h-72px w-auto"
    />
  </div>

  <van-form @submit="onSubmit" ref="formRef">
    <!-- ─────── PASO 1: verificá tu teléfono ─────── -->
    <div class="step-header">
      <span class="step-badge" :class="{ 'step-badge--done': codeSent }">
        <van-icon v-if="codeSent" name="success" />
        <template v-else>1</template>
      </span>
      <span class="step-title">{{ t("routes.register.step1Title") }}</span>
    </div>

    <van-cell-group inset>
      <phone-number-field
        v-model="formData.phone"
        v-model:area-code="areaCode"
        name="phone"
        :rules="phoneRules"
      />
    </van-cell-group>

    <!-- Botón destacado "Enviarme código" -->
    <div class="mx-4 mt-5">
      <van-button
        round
        block
        type="primary"
        @click="getVerifyCode"
        :disabled="!isPhoneValid || isActive"
        class="h-44px"
      >
        {{ codeSent ? countdownButtonText : t("routes.register.sendCode") }}
      </van-button>
    </div>

    <!-- ─────── PASO 2: completá tus datos ─────── -->
    <div class="step-header mt-12">
      <span class="step-badge" :class="{ 'step-badge--inactive': !codeSent }">2</span>
      <span class="step-title" :class="{ 'step-title--inactive': !codeSent }">
        {{ t("routes.register.step2Title") }}
      </span>
    </div>

    <!-- Aviso "Te enviamos un código a +54 …" -->
    <div v-if="codeSent" class="mx-4 mb-3 text-22 text-text-secondary leading-relaxed">
      {{ t("routes.register.codeSentTo", { phone: phoneDisplay }) }}
    </div>

    <!-- Bloque grisado/inhabilitado hasta que se envíe el SMS -->
    <div :class="{ 'step-block--disabled': !codeSent }">
      <van-cell-group inset>
        <van-field
          v-model="formData.verifyCode"
          name="verifyCode"
          :placeholder="t('routes.register.codePlaceholder')"
          :disabled="!codeSent"
          :rules="codeSent ? verifyCodeRules : []"
          maxlength="6"
          type="digit"
          center
        />

        <password-field
          v-model="formData.password"
          name="password"
          maxlength="20"
          :placeholder="t('routes.register.passwordPlaceholder')"
          :disabled="!codeSent"
          :rules="codeSent ? passwordRules : []"
        />

        <password-field
          v-model="formData.confirmPassword"
          name="confirmPassword"
          maxlength="20"
          :placeholder="t('routes.register.confirmPasswordPlaceholder')"
          :disabled="!codeSent"
          :rules="codeSent ? confirmPasswordRules : []"
        />
      </van-cell-group>

      <!-- Código de invitación: oculto por defecto. Si vino por URL ya está
           visible y precargado; si no, aparece como link colapsable. -->
      <div class="mx-4 mt-3">
        <button
          v-if="!showInviteField"
          type="button"
          class="text-22 text-primary cursor-pointer bg-transparent border-none p-0"
          :disabled="!codeSent"
          @click="showInviteField = true"
        >
          {{ t("routes.register.inviteToggle") }}
        </button>
      </div>
      <van-cell-group v-if="showInviteField" inset class="!mt-3">
        <van-field
          v-model="formData.inviteCode"
          name="inviteKey"
          :placeholder="t('routes.register.inviteKeyPlaceholder')"
          :disabled="!codeSent"
        />
      </van-cell-group>
    </div>

    <!-- Términos -->
    <van-cell-group inset class="!my-8 !bg-transparent text-xl">
      <van-checkbox
        v-model="agreement"
        shape="round"
        checked-color="var(--primary-color)"
        :disabled="!codeSent"
      >
        {{ t("routes.register.agreementPrefix") }}
        <span class="text-primary cursor-pointer" @click.stop="showAgreement">
          {{ t("routes.register.agreementText") }}
        </span>
      </van-checkbox>
    </van-cell-group>

    <!-- Crear cuenta -->
    <div class="mx-4 mt-6">
      <van-button
        round
        block
        type="primary"
        native-type="submit"
        :loading="loading"
        :disabled="!agreement || !codeSent"
        class="h-48px"
      >
        {{ t("routes.register.submit") }}
      </van-button>
    </div>
  </van-form>

  <!-- Volver a login -->
  <div class="text-center mt-30px text-text-secondary text-xl">
    {{ t("routes.register.hasAccount") }}
    <span class="text-primary cursor-pointer" @click="goToLogin">
      {{ t("routes.register.login") }}
    </span>
  </div>
</template>

<style scoped>
.step-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 24px;
  margin-bottom: 14px;
}

/* Respiración del form: aire vertical dentro de las cards y entre los
   campos. Estética premium tipo Tesla/Apple, no formulario denso. */
:deep(.van-cell-group--inset) {
  padding: 8px 0;
}

:deep(.van-cell-group--inset .van-cell) {
  padding-top: 14px;
  padding-bottom: 14px;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-color);
  color: #000;
  font-family: var(--font-display, inherit);
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}

.step-badge--inactive {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.5);
}

/* Paso completado: badge verde con check */
.step-badge--done {
  background: var(--brand-success);
  color: #fff;
  font-size: 14px;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  letter-spacing: 0.01em;
  transition: color 0.2s;
}

.step-title--inactive {
  color: rgba(255, 255, 255, 0.45);
}

.step-block--disabled {
  opacity: 0.45;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
</style>

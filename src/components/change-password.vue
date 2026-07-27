<script setup>
import PhoneNumberField from "./phone-number-field.vue";
import SuccessPng from "@/assets/icon_success.png";
import { useCountDown } from '@vant/use';
import { getCountryByCode } from "@/constants/countries";

const props = defineProps({
  phone: {
    type: String,
    default: "",
  },

  areaCode: {
    type: String,
    default: "54",
  },
});

const emit = defineEmits(['submit']);

const router = useRouter();
const { t } = useI18n();

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
} = useAuth(smsApi.resetPwd);

const active = ref(0);
formData.value.phone = props.phone;
areaCode.value = props.areaCode;

const phoneNumberReadOnly = computed(() => !!props.phone);

// Validación local: botón "Obtener código" se habilita solo cuando el
// teléfono cumple el regex del país (AR: 10 dígitos exactos).
// Si el teléfono viene precargado (props.phone, flujo settings con
// usuario logueado), confiamos en el backend.
const isPhoneValid = computed(() => {
  if (props.phone) return true;
  const digits = String(formData.value.phone || "").replace(/\D/g, "");
  const country = getCountryByCode(areaCode.value);
  return country.pattern.test(digits);
});

// El código solo se considera enviado cuando el backend devolvió un
// smsRequestId. Hasta entonces los campos de "código" / "Siguiente"
// quedan deshabilitados para que el usuario entienda el flujo.
const codeSent = computed(() => !!smsRequestId.value);

const countDown = useCountDown({
  time: 3000
});

// Validar y avanzar al paso 2.
const goToNext = async () => {
  await formRef.value.validate(["verifyCode"]);
  active.value = 1;
};

// Validación local de match de password antes de mandar al backend.
// Evita el error "Code does not match" del server cuando el problema
// es que el usuario tipeó dos passwords distintas.
const submitError = ref("");

const onSubmit = async () => {
  submitError.value = "";
  if (formData.value.password !== formData.value.confirmPassword) {
    submitError.value = t("routes.auth.validation.passwordMismatch");
    showToast(submitError.value);
    return;
  }
  try {
    emit('submit', {
      ...formData.value,
      smsRequestId: smsRequestId.value,
      phone: phoneNumber.value,
    });
  } catch (error) {
    showToast(t("routes.settings.changePassword.messages.changeFailed"));
  }
};

// Pantalla de éxito: arrancar countdown y saltar al paso 3.
const handlePasswordChangeSuccess = () => {
  countDown.start();
  active.value = 2;
};

defineExpose({
  handlePasswordChangeSuccess
});
</script>

<template>
  <div class="password-page">
    <div class="w-full bg-surface px-4 py-5 mb-12px">
      <van-steps :active="active">
        <van-step>{{
          t("routes.settings.changePassword.steps.phoneVerify")
          }}</van-step>
        <van-step>{{
          t("routes.settings.changePassword.steps.setPassword")
          }}</van-step>
        <van-step>{{
          t("routes.settings.changePassword.steps.complete")
          }}</van-step>
      </van-steps>
    </div>

    <van-cell-group inset class="form-wells">
      <van-form ref="formRef" @submit="onSubmit">
        <!-- ─────── PASO 1: verificar teléfono ─────── -->
        <div v-show="active === 0" class="verify-step">
          <phone-number-field v-model="formData.phone" name="phone" v-model:area-code="areaCode"
            :readonly="phoneNumberReadOnly" :rules="phoneRules" class="mb-3" />

          <!-- Campo código: deshabilitado hasta que se solicite el SMS -->
          <van-field v-model="formData.verifyCode" name="verifyCode"
            :placeholder="t('routes.settings.changePassword.form.verifyCode')"
            :disabled="!codeSent"
            :rules="codeSent ? verifyCodeRules : []"
            maxlength="6"
            type="digit"
            center>
            <template #button>
              <!-- plain (outline): el primario de la pantalla es "Siguiente" -->
              <van-button size="small" type="primary" plain
                @click="getVerifyCode"
                :disabled="!isPhoneValid || isActive"
                class="rounded-lg code-btn">
                {{ countdownButtonText }}
              </van-button>
            </template>
          </van-field>

          <!-- Aclara el canal: el cliente puede esperar un WhatsApp y
               creer que falló si no le llega. -->
          <p v-if="codeSent" class="sms-hint">
            {{ t("routes.settings.changePassword.form.smsHint") }}
          </p>

          <div class="submit-btn">
            <!-- Siguiente: solo habilitado cuando el código ya fue enviado -->
            <van-button round block type="primary" @click="goToNext" :disabled="!codeSent">
              {{ t("routes.settings.changePassword.form.next") }}
            </van-button>
          </div>
        </div>

        <!-- ─────── PASO 2: nueva contraseña ─────── -->
        <div v-show="active === 1" class="verify-step">
          <label class="field-label">
            {{ t("routes.settings.changePassword.form.newPasswordLabel") }}
          </label>
          <password-field v-model="formData.password" name="password"
            maxlength="20"
            :placeholder="t('routes.settings.changePassword.form.newPassword')"
            :rules="passwordRules" />

          <label class="field-label mt-12px">
            {{ t("routes.settings.changePassword.form.confirmPasswordLabel") }}
          </label>
          <password-field v-model="formData.confirmPassword" name="confirmPassword"
            maxlength="20"
            :placeholder="t('routes.settings.changePassword.form.confirmPassword')"
            :rules="confirmPasswordRules" />

          <div class="submit-btn">
            <van-button round block type="primary" native-type="submit">
              {{ t("routes.settings.changePassword.form.confirm") }}
            </van-button>
          </div>
        </div>
      </van-form>

      <!-- ─────── PASO 3: éxito ─────── -->
      <div v-show="active === 2" class="complete-step">
        <van-empty :image="SuccessPng" image-size="80"
          :description="t('routes.settings.changePassword.messages.changeSuccess')">
          <van-button round type="primary" class="bottom-button" @click="router.replace('/')">
            <span v-if="countDown.seconds > 0">
              {{ t('routes.settings.changePassword.backToHome.countdown', { seconds: Math.ceil(countDown.seconds / 1000) }) }}
            </span>
            <span v-else>{{ t('routes.settings.changePassword.backToHome.button') }}</span>
          </van-button>
        </van-empty>
      </div>
    </van-cell-group>
  </div>
</template>

<style scoped>
/* El layout ya pinta el fondo oscuro; ocupamos el alto disponible bajo el
   navbar y centramos la card verticalmente para que no quede "cortada"
   arriba con todo el espacio inferior vacío. */
.password-page {
  background: transparent;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 46px - env(safe-area-inset-top));
  min-height: calc(100dvh - 46px - env(safe-area-inset-top));
}

.password-page > :deep(.van-cell-group--inset) {
  margin-top: auto;
  margin-bottom: auto;
}

/* Outline sobre fondo oscuro: sin el blanco default de van-button--plain */
.code-btn {
  background: transparent;
}

/* Hint bajo el campo de código, mismo tratamiento que el del teléfono. */
.sms-hint {
  margin: 4px 0 0;
  padding: 0 16px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-secondary, rgba(255, 255, 255, 0.55));
}

.verify-step {
  padding: 16px;
}

/* Labels arriba de los campos de password (paso 2). */
.field-label {
  display: block;
  margin: 0 0 6px 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  letter-spacing: 0.01em;
}

.submit-btn {
  margin: 24px 16px;
}

.complete-step {
  display: flex;
  justify-content: center;
  align-items: center;
  /* La card ya se centra en el viewport; solo un poco de cuerpo propio. */
  min-height: 40vh;
}

/* 步骤切换动画 */
.van-form,
.verify-step {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

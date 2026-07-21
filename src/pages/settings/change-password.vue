<script setup>
import SuccessPng from "@/assets/icon_success.png";
import { useCountDown } from '@vant/use';
import { myPageApi } from "@/api";

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

const countDown = useCountDown({
  time: 3000
});

// 验证并进入下一步
const goToNext = async () => {
  await formRef.value.validate(["verifyCode"]);
  active.value = 1;
};

// 提交新密码
const onSubmit = async () => {

  myPageApi.setPwd({
    pwd: formData.value.password,
    newPwd: formData.value.confirmPassword,
  });

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

// 添加一个新方法处理密码修改成功
const handlePasswordChangeSuccess = () => {
  countDown.start();
  active.value = 2;
};

// 将 handlePasswordChangeSuccess 方法添加到 defineExpose
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

    <van-cell-group inset>
      <!-- 手机号验证步骤 -->
      <van-form ref="formRef" @submit="onSubmit">
        <div v-show="active === 0" class="verify-step">
          <phone-number-field v-model="formData.phone" name="phone" v-model:area-code="areaCode"
            :readonly="phoneNumberReadOnly" :rules="phoneRules" class="mb-3" />

          <van-field v-model="formData.verifyCode" name="verifyCode"
            :placeholder="t('routes.settings.changePassword.form.verifyCode')" center :rules="verifyCodeRules"
            maxlength="6" type="digit">
            <template #button>
              <van-button size="small" type="primary" @click="getVerifyCode" :disabled="isActive" class="rounded-lg">
                {{ countdownButtonText }}
              </van-button>
            </template>
          </van-field>

          <div class="submit-btn">
            <van-button round block type="primary" @click="goToNext">
              {{ t("routes.settings.changePassword.form.next") }}
            </van-button>
          </div>
        </div>

        <div v-show="active === 1" class="verify-step">
          <!-- 设置新密码步骤 -->
          <password-field v-model="formData.password" name="password"
            maxlength="20"
            :placeholder="t('routes.settings.changePassword.form.newPassword')" :rules="passwordRules" />

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

      <!-- 完成步骤 -->
      <div v-show="active === 2" class="complete-step">
        <van-empty :image="SuccessPng" image-size="80" :description="t('routes.settings.changePassword.messages.changeSuccess')
          ">
          <van-button round type="primary" class="bottom-button" @click="router.replace('/')">
            <span v-if="countDown.seconds > 0">
              {{ t('routes.settings.changePassword.backToHome.countdown', { seconds: countDown.seconds }) }}
            </span>
            <span v-else>
              {{ t('routes.settings.changePassword.backToHome.button') }}
            </span>
          </van-button>
        </van-empty>
      </div>
    </van-cell-group>
  </div>
</template>

<style scoped>
.password-page {
  background: var(--background-color);
}

.verify-step {
  padding: 16px;
}

.submit-btn {
  margin: 24px 16px;
}

.complete-step {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
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

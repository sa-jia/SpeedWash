<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'
import { myPageApi } from '@/api'

const router = useRouter()
const { t } = useI18n()

const loading = ref(false)
const formData = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 验证确认密码
const validateConfirmPassword = (value) => {
  if (!value) {
    return t('routes.settings.changePassword.validation.confirmRequired')
  }
  if (value !== formData.value.newPassword) {
    return t('routes.settings.changePassword.validation.passwordMismatch')
  }
  return true
}

// 提交表单
const onSubmit = async () => {
  if (loading.value) return
  loading.value = true

  const { error } = await myPageApi.setPwd({
    pwd: formData.value.oldPassword,
    newPwd: formData.value.newPassword,
  })

  loading.value = false;

  if (unref(error)) {
    showToast(unref(error))
    return
  }

  showToast(t('routes.settings.changePassword.messages.changeSuccess'))
  router.back()
}
</script>

<template>
  <div class="change-password">
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <!-- 原密码 -->
        <van-field v-model="formData.oldPassword" type="password"
          :placeholder="t('routes.settings.changePassword.form.oldPassword')" :rules="[
            { required: true, message: t('routes.settings.changePassword.validation.oldRequired') },
          ]" />

        <!-- 新密码 -->
        <van-field v-model="formData.newPassword" type="password"
          :placeholder="t('routes.settings.changePassword.form.newPassword')" :rules="[
            { required: true, message: t('routes.settings.changePassword.validation.newRequired') },
            { min: 6, max: 20, message: t('routes.settings.changePassword.validation.passwordLength') },
          ]" />

        <!-- 确认新密码 -->
        <van-field v-model="formData.confirmPassword" type="password"
          :placeholder="t('routes.settings.changePassword.form.confirmPassword')"
          :rules="[{ validator: validateConfirmPassword }]" />
      </van-cell-group>

      <!-- 提交按钮 -->
      <van-action-bar>
        <van-action-bar-button type="primary" native-type="submit" :loading="loading">{{
          t('routes.settings.changePassword.form.confirm') }}</van-action-bar-button>
      </van-action-bar>
      <!-- <div class="px-4 mt-8">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="loading"
          class="h-48px"
        >
          {{ t('routes.settings.changePassword.form.submit') }}
        </van-button>
      </div> -->
    </van-form>
  </div>
</template>

<style scoped>
.change-password {
  min-height: 100vh;
  background: #f7f8fa;
  padding-top: 16px;
}
</style>

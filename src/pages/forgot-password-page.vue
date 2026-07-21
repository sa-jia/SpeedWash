<script setup>

import { loginApi } from "@/api";

// 跳转首页
const goToHome = () => {
  console.log("跳转到首页");
};

const changePasswordRef = useTemplateRef("changePasswordRef");

const onSubmit = async (data) => {
  const { error } = await loginApi.resetPwd({
    phoneNum: data.phone,
    smsCode: data.verifyCode,
    smsRequestId: data.smsRequestId,
    pwd: data.password,
  });
  if (unref(error)) {
    showToast(unref(error));
    return;
  }

  changePasswordRef.value.handlePasswordChangeSuccess();

};
</script>
<template>
  <change-password ref="changePasswordRef" @submit="onSubmit" />
</template>

<style scoped></style>

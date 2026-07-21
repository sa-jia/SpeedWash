<script setup></script>

<template>
  <!-- 顶部安全区适配 -->
  <!-- <van-nav-bar safe-area-inset-top /> -->

  <sr-payment-provider>
    <router-view />
  </sr-payment-provider>

  <!-- 底部安全区适配 -->
  <!-- <van-number-keyboard safe-area-inset-bottom /> -->
</template>

<style scoped></style>

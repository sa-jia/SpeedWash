<script setup>

</script>

<template>
  <div class="invite-container p-b-50 overflow-y-auto">
    <slot />
  </div>
</template>

<style scoped>
.invite-container {
  background-image: url("@/assets/invite_page_bg.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  height: calc(100vh - var(--van-nav-bar-height));
}
</style>

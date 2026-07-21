<script setup>
import groupBg from "@/assets/invite/group_bg.png";

defineProps({
  title: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <!-- TODO: 注意打包问题 -->
  <van-cell-group inset class="!bg-transparent">
    <div class="flex flex-col p-20px invite-group__content">
      <invite-group-header class="mt-45" :title="title" />

      <slot />
    </div>
  </van-cell-group>
</template>

<style scoped>
.invite-group__content {
  background-image: url("@/assets/invite/group_bg.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

:deep(.van-grid-item__content) {
  --van-grid-item-text-color: #999999;
  background: transparent;
}

:deep(.van-grid-item__content--center) {
  justify-content: start;
}
</style>

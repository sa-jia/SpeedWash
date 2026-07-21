<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div
    class="flex items-center justify-center gap-4 text-primary"
  >
    //////
    <van-icon name="star" />
    <div class="underline-text text-3xl">
      <span class="z-2 pos-relative">{{ title }}</span>
    </div>
    <van-icon name="star" />
    \\\\\\
  </div>
</template>

<style scoped>
.underline-text {
  --underline-height: 7px;
  --underline-color: #FFC1B9;
  /* --underline-opacity: 0.3; */
  --underline-offset: 0px;
  position: relative;
  display: inline-block;
}

.underline-text::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: calc(var(--underline-offset) * -1);
  width: 100%;
  height: var(--underline-height);
  background-color: var(--underline-color);
  opacity: var(--underline-opacity);
  border-radius: calc(var(--underline-height) / 2);
}
</style>

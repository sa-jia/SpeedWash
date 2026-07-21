<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  value: {
    type: String,
    default: "",
  },
  isLink: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <van-cell-group inset>
    <van-cell class="group-card-head" :title="title" :value="value" :is-link="isLink">
      <template #title v-if="$slots.title">
        <slot name="title" />
      </template>
    </van-cell>
    <slot />
  </van-cell-group>
</template>

<style scoped>
.group-card-head {
  background: rgba(0, 187, 252, 0.08) !important;
}
.group-card-head :deep(.van-cell__title),
.group-card-head :deep(.van-cell__value) {
  color: var(--primary-light);
}
</style>

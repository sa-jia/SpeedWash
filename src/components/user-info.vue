<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  isLink: {
    type: Boolean,
    default: false,
  },
});

const avatar = computed(
  () => new URL("/src/assets/icon_avatar.png", import.meta.url).href
);

const emit = defineEmits(["click"]);

const handleClick = () => {
  emit("click");
};
</script>

<template>
  <div class="user-info ">
    <user-avatar-cell
      :title="title"
      :label="label"
      :is-link="isLink"
      @click="handleClick"
    />

    <slot />
  </div>
</template>

<style scoped>
.user-avatar-cell {
  --van-cell-horizontal-padding: 0;
}
</style>

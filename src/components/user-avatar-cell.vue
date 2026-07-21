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
  url: {
    type: String,
    default: "",
  },
  to: {
    type: [String, Object],
    default: "",
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
  <van-cell-group inset class="!bg-transparent">
    <van-cell
      class="user-avatar-cell text-left !bg-transparent"
      center
      :border="false"
      :title="title"
      :label="label"
      :is-link="isLink"
      :to="to"
      :url="url"
      @click="handleClick"
    >
      <template #icon>
        <div
          class="flex items-center justify-center rounded-full bg-surface-2 b-1 b-solid b-line w-140 aspect-ratio-1 mr-28"
        >
          <van-image
            class="w-67 aspect-ratio-1 rounded-full"
            :src="avatar"
            fit="contain"
          >
            <template #loading>
              <van-loading type="spinner" size="20" />
            </template>
            <template #error>
              <van-icon name="user-o" size="20" />
            </template>
          </van-image>
        </div>
      </template>
    </van-cell>
  </van-cell-group>
</template>

<style scoped>
.user-avatar-cell {
  --van-cell-horizontal-padding: 0;
}
</style>

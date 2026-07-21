<script setup>

const props = defineProps({
  image: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["click"]);

const handleClick = () => {
  emit('click')
}

</script>

<template>
  <div class="pos-relative">
    <van-image :src="image" class="w-full" />
    <div class="grid grid-center pos-absolute left-0 bottom-0 w-full p-30px">
      <van-button color="#FFF1AD" class="w-500 !text-primary !font-bold !text-3xl" round @click="handleClick">
        <slot />
      </van-button>
    </div>
  </div>
</template>

<style scoped></style>

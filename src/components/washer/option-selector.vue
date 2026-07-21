<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
    required: true,
  },
  keyField: {
    type: String,
    required: true,
  },
});

const selectedItem = defineModel();
</script>

<template>
  <div class="flex flex-wrap justify-center gap-4">
    <div
      v-for="item in items"
      :key="item[keyField]"
      :class="selectedItem && selectedItem[keyField] === item[keyField] ? 'border-primary bg-primary/10' : 'border-line bg-surface'"
      class="b-2 b-rd-lg b-solid text-center aspect-[7/6] flex flex-col justify-center items-center gap-4xl cursor-pointer basis-[calc((100%-2rem)/3)] grow-0 shrink-0"
      @click="selectedItem = item"
    >
      <slot v-bind:item="item" />
    </div>
  </div>
</template>

<style scoped>
.grid > div {
  transition: all 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
</style> 
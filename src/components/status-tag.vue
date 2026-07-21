<script setup>

const { t } = useI18n()

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  // 状态 默认-1 不显示  0就绪 1繁忙 2离线
  status: {
    type: [String, Number],
    default: 2,
    validator: (value) => [0, 1, 2].includes(value)
  }
});

// 状态样式映射
const statusClass = computed(() => {
  const classMap = {
    0: 'bg-[rgba(52,211,153,0.14)]',   // 空闲
    1: 'bg-[rgba(0,187,252,0.14)]',    // 繁忙
    2: 'bg-[rgba(255,255,255,0.06)]'   // 维护
  };
  return classMap[props.status] || 'bg-surface-2';
});

const statusText = computed(() => {
  return t(`routes.washer.status.${props.status}`)
})

const statusTextClass = computed(() => {
  const classMap = {
    0: 'text-success',
    1: 'text-primary',
    2: 'text-text-secondary'
  }
  return classMap[props.status] || 'text-text-secondary'
})
</script>

<template>
  <div class="relative w-max h-54 p-x-2.5 flex items-center justify-center min-w-20">
    <div class="z-1 translate-x-2.5 text-2xl" :class="statusTextClass">
      {{ statusText }}
    </div>
    <div 
      class="absolute inset-0 rd-lg transform skew-x--15deg"
      :class="statusClass"
    />
    <div 
      class="absolute top-0 right--5 w-full h-54"
      :class="statusClass"
    />
  </div>
</template>
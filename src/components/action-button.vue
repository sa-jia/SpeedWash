<script setup>
defineProps({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'primary'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
  },
  iconPosition: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click')
}
</script>

<template>
  <div class="fixed left-0 right-0 bottom-0 pb-safe bg-surface b-t-1 b-t-solid b-line">
    <slot name="tip" />
    
    <div class="p-4">
      <van-button
        block
        round
        :type="type"
        :disabled="disabled"
        :loading="loading"
        :icon="icon"
        :icon-position="iconPosition"
        size="large"
        @click="handleClick"
      >
        {{ text }}
      </van-button>
    </div>
  </div>
</template> 
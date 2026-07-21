<script setup>
// 如果需要控制动画的显示/隐藏，可以添加 props
defineProps({
  show: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <div class="relative w-200px h-200px">
    <!-- 发光效果 -->
    <div class="payment-animation-base w-120px h-120px rounded-full bg-green-500/50 animate-glow"></div>
    
    <!-- 成功圆圈 -->
    <div class="payment-animation-base w-100px h-100px bg-green-500 rounded-full animate-expand">
      <!-- 对勾标记 -->
      <div class="payment-animation-base w-40px h-24px -translate-y-[65%] rotate-[-45deg]">
        <div class="checkmark-left"></div>
        <div class="checkmark-right"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 移除 @apply，直接使用类名 */
.checkmark-left,
.checkmark-right {
  position: absolute;
  background-color: white;
}

.checkmark-left {
  top: 0;
  left: 0;
  width: 6px;
  height: 0;
  animation: drawLeftPart 0.2s ease-out 0.5s forwards;
}

.checkmark-right {
  bottom: 0;
  left: 0;
  width: 0;
  height: 6px;
  animation: drawRightPart 0.2s ease-out 0.7s forwards;
}

@keyframes drawLeftPart {
  from { height: 0; }
  to { height: 24px; }
}

@keyframes drawRightPart {
  from { width: 0; }
  to { width: 40px; }
}

/* 在 uno.config.ts 中定义这些自定义动画 */
</style>
<script setup>
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
    <div class="payment-animation-base w-120px h-120px rounded-full bg-red-500/50 animate-glow"></div>
    
    <!-- 失败圆圈 -->
    <div class="payment-animation-base w-100px h-100px bg-red-500 rounded-full animate-expand">
      <!-- 叉号标记 -->
      <div class="payment-animation-base w-40px h-40px rotate-[-45deg]">
        <div class="crossmark-vertical"></div>
        <div class="crossmark-horizontal"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crossmark-vertical,
.crossmark-horizontal {
  position: absolute;
  background-color: white;
  left: 17px;
  transform-origin: center;
}

.crossmark-vertical {
  width: 6px;
  height: 0;
  animation: drawVertical 0.3s ease-out 0.5s forwards;
}

.crossmark-horizontal {
  width: 0;
  height: 6px;
  top: 17px;
  left: 40px;
  animation: drawHorizontal 0.3s ease-out 0.8s forwards;
}

@keyframes drawVertical {
  from {
    height: 0;
    top: 0;
  }
  to {
    height: 40px;
    top: 0;
  }
}

@keyframes drawHorizontal {
  from {
    width: 0;
    left: 40px;
  }
  to {
    width: 40px;
    left: 0;
  }
}
</style>
<script setup>
defineProps({
  show: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <div class="relative w-200px h-200px">
    <!-- 发光效果 -->
    <div
      class="payment-animation-base w-120px h-120px rounded-full bg-red-500/50 animate-glow"
    ></div>

    <!-- 失败圆圈 -->
    <div
      class="payment-animation-base w-100px h-100px bg-red-500 rounded-full animate-expand"
    >
      <!-- 感叹号标记 -->
      <div class="payment-animation-base w-40px h-40px">
        <div class="exclamation-dot"></div>
        <div class="exclamation-line"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exclamation-line,
.exclamation-dot {
  position: absolute;
  background-color: white;
  left: 50%;
  transform: translateX(-50%);
}

.exclamation-line {
  width: 6px;
  height: 0;
  top: 0;
  animation: drawLine 0.3s ease-out 0.5s forwards;
}

.exclamation-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  bottom: 5px;
  transform: translate(-50%, 0) scale(0);
  animation: drawDot 0.3s ease-out 0.8s forwards;
}

@keyframes drawLine {
  from {
    height: 0;
    top: 0;
  }
  to {
    height: 20px;
    top: 0;
  }
}

@keyframes drawDot {
  from {
    transform: translate(-50%, 0) scale(0);
  }
  to {
    transform: translate(-50%, 0) scale(1);
  }
}
</style>

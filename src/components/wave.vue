<script setup>

const props = defineProps({
  width: {
    type: [Number, String],
    default: '100vw',
  },
  type: {
    type: String,
    default: 'horizontal',
    validator: (value) => ['horizontal', 'tilt'].includes(value)
  }
})

const _width = computed(() => {
  return typeof props.width === 'number' ? `${props.width}px` : props.width
})
</script>

<template>
  <div class="wave-container" :class="{
    'wave-container--horizontal': props.type === 'horizontal',
    'wave-container--tilt': props.type === 'tilt',
  }" :style="{ width: _width }">
    <div class="wave"></div>
  </div>
</template>

<style scoped>
.wave-container {
  height: 100vh;
  margin: 0;
  padding: 0;
  /* background: linear-gradient(180deg, #001f3f, #0074d9, #7fdbff); */
  background: var(--background-color);
  overflow: hidden;
  position: absolute;
}

.wave,
.wave-container::before,
.wave-container::after {
  background: var(--primary-color);
  width: calc(2 * max(100vw, 100vh));
  aspect-ratio: 1 / 1;
  opacity: 1;
  position: absolute;
  bottom: 80%;
  border-radius: 43%;
  animation: spin linear infinite;
  animation-duration: 22s;
}

.wave-container--horizontal .wave,
.wave-container--horizontal::before,
.wave-container--horizontal::after  {
  left: calc(-0.5 * max(100vw, 100vh));
}

.wave-container--tilt .wave,
.wave-container--tilt::before,
.wave-container--tilt::after  {
  left: calc(-0.4 * max(100vw, 100vh));
}

.wave-container::before,
.wave-container::after {
  content: "";
}

.wave-container::before {
  animation-duration: 20s;
  background-color: var(--primary-color);
  opacity: 0.5;
}

.wave-container::after {
  animation-duration: 24s;
  background-color: var(--primary-color);
  opacity: 0.3;
}

@keyframes spin {
  from {
    transform: rotate(360deg);
  }
}
</style>

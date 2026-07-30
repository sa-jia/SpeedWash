<script setup>
// Estado intermedio: Mercado Pago volvió con `pending`/`in_process` (típico del
// pago con "dinero en cuenta", que confirma un instante después). NO es un
// fallo, así que usamos el color de acento (ámbar) y un spinner en lugar de la
// X roja, para no asustar a un cliente cuyo pago sí se está acreditando.
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
    <div class="payment-animation-base w-120px h-120px rounded-full bg-accent/40 animate-glow"></div>

    <!-- Círculo ámbar con spinner -->
    <div class="payment-animation-base w-100px h-100px bg-accent rounded-full animate-expand">
      <div class="processing-spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.processing-spinner {
  position: absolute;
  width: 44px;
  height: 44px;
  border: 5px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

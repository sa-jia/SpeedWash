<script setup>
import { PAYMENT_STATUS } from '@/constants';
import PaymentSuccessAnimation from './sr-payment-success.vue'
import PaymentFailureAnimation from './sr-payment-failure.vue'
import PaymentProcessingAnimation from './sr-payment-processing.vue'

const props = defineProps({
  status: {
    type: String,
    default: PAYMENT_STATUS.SUCCESS,
    validator: (value) => Object.values(PAYMENT_STATUS).includes(value)
  }
})

const { t } = useI18n()

// pending / processing NO son un fallo: Mercado Pago suele volver con estos
// estados cuando el pago con "dinero en cuenta" todavía se está acreditando.
// Mostramos un estado neutro (ámbar + spinner) en vez de la X roja para no
// hacerle creer al cliente que su pago falló cuando en realidad se acredita.
const isProcessing = computed(
  () =>
    props.status === PAYMENT_STATUS.PENDING ||
    props.status === PAYMENT_STATUS.PROCESSING
)
</script>

<template>
  <div class="flex-center flex-col">
    <payment-success-animation v-if="status === PAYMENT_STATUS.SUCCESS" />
    <payment-processing-animation v-else-if="isProcessing" />
    <payment-failure-animation v-else />
    <p
      class="mt-4 text-3xl fw-bold"
      :class="{
        'text-green-500': status === PAYMENT_STATUS.SUCCESS,
        'text-accent': isProcessing,
        'text-red-500': status !== PAYMENT_STATUS.SUCCESS && !isProcessing,
      }"
    >
      <span v-if="status === PAYMENT_STATUS.SUCCESS">{{ t('payment.result.success') }}</span>
      <span v-else-if="isProcessing">{{ t('payment.result.processing') }}</span>
      <span v-else-if="status === PAYMENT_STATUS.TIMEOUT">{{ t('payment.result.timeout') }}</span>
      <span v-else-if="status === PAYMENT_STATUS.CANCELLED">{{ t('payment.result.cancelled') }}</span>
      <span v-else>{{ t('payment.result.failure') }}</span>
    </p>
  </div>
</template>

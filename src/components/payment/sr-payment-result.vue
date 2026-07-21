<script setup>
import { PAYMENT_STATUS } from '@/constants';
import PaymentSuccessAnimation from './sr-payment-success.vue'
import PaymentFailureAnimation from './sr-payment-failure.vue'

defineProps({
  status: {
    type: String,
    default: PAYMENT_STATUS.SUCCESS,
    validator: (value) => Object.values(PAYMENT_STATUS).includes(value)
  }
})

const { t } = useI18n()
</script>

<template>
  <div class="flex-center flex-col">
    <payment-success-animation v-if="status === PAYMENT_STATUS.SUCCESS" />
    <payment-failure-animation v-else />
    <p class="mt-4 text-3xl fw-bold" :class="status === PAYMENT_STATUS.SUCCESS ? 'text-green-500' : 'text-red-500'">
      <span v-if="status === PAYMENT_STATUS.SUCCESS">{{ t('payment.result.success') }}</span>
      <span v-else-if="status === PAYMENT_STATUS.TIMEOUT">{{ t('payment.result.timeout') }}</span>
      <span v-else-if="status === PAYMENT_STATUS.CANCELLED">{{ t('payment.result.cancelled') }}</span>
      <span v-else>{{ t('payment.result.failure') }}</span>
    </p>
  </div>
</template>
import { defineStore } from 'pinia'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe('your_publishable_key') // 替换成你的 Stripe publishable key

export const usePaymentStore = defineStore('payment', {
  state: () => ({
    isProcessing: false,
    error: null
  }),

  actions: {
    async initiatePayment(amount) {
      this.isProcessing = true
      this.error = null
      
      try {
        const stripe = await stripePromise
        const { error } = await stripe.redirectToCheckout({
          lineItems: [{
            price: 'price_xxx', // 替换成你的 Stripe 价格 ID
            quantity: 1,
          }],
          mode: 'payment',
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-cancel`,
        })

        if (error) {
          this.error = error.message
        }
      } catch (err) {
        this.error = err.message
      } finally {
        this.isProcessing = false
      }
    }
  }
}) 
<script setup>
import { loadStripe } from "@stripe/stripe-js/pure";
import StripeLogo from "@/assets/stripe/powered_by_stripe__blurple.svg";

const props = defineProps({
  clientSecret: {
    type: String,
    required: true,
    validator: (value) => value && value.startsWith("pi_"),
  },
  publicKey: {
    type: String,
    required: true,
    validator: (value) => value && value.startsWith("pk_"),
  },
  returnUrl: {
    type: String,
    required: true,
  },
});

const isLoading = ref(false);
const messages = ref([]);
const stripe = ref(null);
const elements = ref(null);

const paymentElementReady = ref(false);
const paymentElementRenderStart = ref(false);

const paymentElementContainer = useTemplateRef("paymentElementContainerRef");

const emit = defineEmits(["success", "fail", "loaded", "loaderror", "loaderstart"]);

async function initStripe() {
  stripe.value = await loadStripe(props.publicKey);

  if (!stripe.value) {
    messages.value.push("Failed to load Stripe.");
    return;
  }

  elements.value = stripe.value.elements({
    clientSecret: props.clientSecret,
    appearance: {
      theme: "flat",
      variables: {
        // Azul de marca Speed Wash (Stripe Appearance no lee CSS vars,
        // requiere hex literal; mantener en sync con --primary-color).
        colorPrimary: "#00BBFC",
      },
    },
  });

  const paymentElement = elements.value.create("payment");
  paymentElement.mount(paymentElementContainer.value);

  paymentElement.on("ready", (event) => {
    paymentElementReady.value = true;
    emit("loaded");
  });
  // loaderror
  paymentElement.on("loaderror", (event) => {
    // TODO: 需要处理 loaderror 的错误 catch
    emit("loaderror");
  });

  // loaderstart
  paymentElement.on("loaderstart", (event) => {
    paymentElementRenderStart.value = true;
    emit("loaderstart");
  });

  // const linkAuthenticationElement = elements.create("linkAuthentication");
  // linkAuthenticationElement.mount("#link-authentication-element");

  isLoading.value = false;
}

onMounted(async () => {
  nextTick(initStripe);
});

const handleSubmit = async () => {
  if (isLoading.value) {
    return;
  }
  isLoading.value = true;
  try {
    console.log("returnUrl", props.returnUrl);

    const { error, paymentIntent } = await stripe.value.confirmPayment({
      elements: elements.value,
      redirect: "if_required",
      confirmParams: {
        return_url: props.returnUrl,
      },
    });

    const e = paymentIntent?.last_payment_error
    if (e) {
      console.log(`PaymentIntent ${paymentIntent.id} experienced a ${e.type} error.`)
      messages.value.push(e.message);
      emit("fail", e);
    }

    if (error) {
      if (error.message) {
        messages.value.push(error.message);
        emit("fail", error);
      } else {
        messages.value.push("An unexpected error occured.");
        emit("fail", new Error("An unexpected error occured."));
      }
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      emit("success");
    }
  } catch (error) {
    console.error(error);
  }

  isLoading.value = false;
};
</script>
<template>
  <form id="payment-form" class="pb-safe-114" @submit.prevent="handleSubmit">
    <div id="link-authentication-element" />
    <div ref="paymentElementContainerRef" id="payment-element"></div>
    <sr-messages class="my-10 text-lg text-red-5" :messages="messages" />

    <div class="fixed pb-safe px-5 left-0 right-0 bottom-0">
      <van-skeleton
        :loading="paymentElementRenderStart && !paymentElementReady"
        animated
      >
        <template #template>
          <div class="flex flex-col items-center w-full">
            <van-skeleton-paragraph class="h-50px rounded-full w-full" />
            <div class="grid grid-center h-44px w-100px">
              <van-skeleton-paragraph class="h-30px w-100px" />
            </div>
          </div>
        </template>

        <!-- 实际内容 -->
        <template v-if="paymentElementReady">
          <van-button
            native-type="submit"
            round
            block
            color="var(--primary-color)"
            size="large"
            :loading="isLoading"
          >
            {{ $t("components.payment.pay") }}
          </van-button>

          <div class="grid grid-center h-44px">
            <stripe-logo :width="100" :height="30" />
          </div>
        </template>
      </van-skeleton>
    </div>
    <!-- </div> -->
  </form>
</template>

<style scoped></style>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const show = defineModel("show");
const selectedCard = defineModel("selectedCard");

const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
  washPlans: {
    type: Array,
    default: () => []
  },
  mark: {
    type: Number,
  }
});

const loading = ref(false);
const finished = ref(false);

const onLoad = () => {
  setTimeout(() => {
    loading.value = false;
    finished.value = true;
  }, 1000);
};

// Tocar una tarjeta solo la resalta; confirmar con "Usar esta tarjeta".
// Volver a tocar la seleccionada la deselecciona.
const selectCard = (card) => {
  selectedCard.value = selectedCard.value?.cardId === card.cardId ? null : card;
};

// Confirmar el uso de la tarjeta resaltada.
const confirmUse = () => {
  if (!selectedCard.value) return;
  show.value = false;
};

// Pagar sin tarjeta: limpia la selección y cierra.
const cancelSelect = () => {
  selectedCard.value = null;
  show.value = false;
};

const getMarkName = mark => props.washPlans.find(item => item.mark === mark)?.name;

</script>

<template>
  <van-popup
    v-model:show="show"
    round
    position="bottom"
    :style="{ height: '70%' }"
  >
    <div class="flex flex-col h-full bg-background">
      <div class="p-4 text-center border-b">
        <div class="text-3xl font-bold">{{ t("components.vipCardSelector.title") }}</div>
        <div class="text-22 text-text-secondary mt-1">{{ t("components.vipCardSelector.subtitle") }}</div>
      </div>
      <div class="flex-1 overflow-hidden">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          :finished-text="t('components.vipCardSelector.noMore')"
          @load="onLoad"
          class="h-full overflow-auto"
        >
          <div class="p-4 space-y-4">
            <coupon-card
              v-for="card in props.list"
              :key="card.cardId"
              :card-info="card"
              :active="selectedCard?.cardId === card.cardId"
              :disabled="card.mark !== mark"
              :mark-name="getMarkName(card.mark)"
              @click="selectCard(card)"
            />
          </div>
        </van-list>
      </div>
      <div class="p-4 border-t flex flex-col gap-3">
        <van-button block round type="primary" size="large" :disabled="!selectedCard" @click="confirmUse">
          {{ t('components.vipCardSelector.use') }}
        </van-button>
        <van-button block round size="large" class="skip-btn" @click="cancelSelect">
          {{ t('components.vipCardSelector.notUse') }}
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<style scoped>
.skip-btn {
  background: transparent;
  border: 1px solid var(--line-color);
  color: var(--text-secondary);
}
</style>

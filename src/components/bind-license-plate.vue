<script setup>
const { t } = useI18n();

const show = defineModel("show");
const licenseNo = ref("");

const props = defineProps({
  // Patente ya vinculada (si la hay): precarga el campo para editarla.
  initial: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["success"]);

// Título según haya o no una patente previa.
const titleKey = computed(() =>
  props.initial ? "routes.voucher.licensePlate.change" : "routes.voucher.licensePlate.bind"
);

// Formatos de patente argentina (ya en mayúsculas y sin separadores):
//  - Mercosur auto: AB123CD  (2 letras, 3 números, 2 letras)
//  - Mercosur moto: A123BC   (1 letra, 3 números, 2 letras)
//  - Vieja auto:    ABC123   (3 letras, 3 números)
const PLATE_RE = /^([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]\d{3}[A-Z]{2}|[A-Z]{3}\d{3})$/;

// Patente normalizada: mayúsculas, solo alfanumérico, máximo 7 caracteres.
const normalized = computed(() =>
  licenseNo.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7)
);

const isValid = computed(() => PLATE_RE.test(normalized.value));

// Sanitizar mientras escribe para que no pueda meter cualquier cosa.
const onInput = () => {
  licenseNo.value = normalized.value;
};

const bind = () => {
  if (!isValid.value) {
    showToast(t("routes.voucher.licensePlate.invalid"));
    return;
  }
  emit("success", normalized.value);
  show.value = false;
};

const cancel = () => {
  show.value = false;
};

// Al abrir, precargar la patente actual (si existe) para poder editarla.
watch(show, (open) => {
  if (open) licenseNo.value = (props.initial || "").toUpperCase();
});
</script>

<template>
  <van-popup
    v-model:show="show"
    round
    position="bottom"
    :style="{ height: '50%' }"
  >
    <div class="bg-background flex flex-col h-full px-16px">
      <h3 class="plate-title">{{ t(titleKey) }}</h3>
      <van-form autocomplete="off">
        <van-cell-group inset>
          <van-field
            name="licenseNo"
            v-model="licenseNo"
            maxlength="7"
            :placeholder="t('routes.voucher.licensePlate.placeholder')"
            class="plate-field"
            @update:model-value="onInput"
          />
        </van-cell-group>

        <p class="plate-hint">{{ t("routes.voucher.licensePlate.hint") }}</p>

        <div class="flex gap-3 mt-24">
          <van-button round block class="plate-btn plate-btn--ghost" @click="cancel">
            {{ t("routes.voucher.licensePlate.cancel") }}
          </van-button>

          <van-button round block type="primary" class="plate-btn" :disabled="!isValid" @click="bind">
            {{ t("routes.voucher.licensePlate.confirm") }}
          </van-button>
        </div>
      </van-form>
    </div>
  </van-popup>
</template>

<style scoped>
.plate-title {
  text-align: center;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 24px 0 16px;
}

.plate-field :deep(.van-field__control) {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 700;
  font-size: 18px;
}

.plate-hint {
  margin: 12px 4px 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-secondary);
  text-align: center;
}

.plate-btn {
  flex: 1;
  height: 44px;
  font-weight: 700;
}

.plate-btn--ghost {
  background: transparent;
  border: 1px solid var(--line-color);
  color: var(--text-secondary);
}
</style>

<script setup>
import { COUNTRIES, getCountryByCode } from "@/constants/countries";

const { t } = useI18n();

const model = defineModel();
const areaCode = defineModel("areaCode", {
  type: String,
  default: "54",
});

const props = defineProps({
  readonly: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: "",
  },
  rules: {
    type: Array,
    required: true,
  },
});

// País actual (derivado del areaCode). AR por default.
const currentCountry = computed(() => getCountryByCode(areaCode.value));

// Hint bajo el campo. AR (mercado principal) muestra el aviso explícito
// "sin 0/15/+54"; el resto, la cantidad de dígitos esperada según el país.
const phoneHint = computed(() => {
  const c = currentCountry.value;
  if (c.code === "54") return t("components.phoneNumberField.hintAr");
  if (c.minLength === c.maxLength)
    return t("components.phoneNumberField.hintDigits", { count: c.maxLength });
  return t("components.phoneNumberField.hintDigitsRange", {
    min: c.minLength,
    max: c.maxLength,
  });
});

// Opciones del picker, etiquetadas con la traducción del país.
const areaCodeColumns = computed(() =>
  COUNTRIES.map((c) => ({
    text: t(`components.phoneNumberField.country.${c.i18nKey}`),
    iso: c.iso,
    value: c.code,
  }))
);

const showAreaPicker = ref(false);

const onAreaCodeConfirm = ({ selectedOptions }) => {
  const newCode = selectedOptions[0].value;
  areaCode.value = newCode;
  showAreaPicker.value = false;

  // Si el número ya cargado excede el nuevo maxLength, lo truncamos.
  const next = getCountryByCode(newCode);
  if (model.value && model.value.length > next.maxLength) {
    model.value = model.value.slice(0, next.maxLength);
  }
};

const onAreaCodeClick = () => {
  if (props.readonly) {
    return;
  }
  showAreaPicker.value = true;
};

// Sanitiza input: solo dígitos, trunca a maxLength del país.
// Lo hacemos en el modelo (no en el DOM) para que el v-model siempre
// refleje el valor visible.
const onInput = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  const limited = digits.slice(0, currentCountry.value.maxLength);
  model.value = limited;
};
</script>

<template>
  <van-field
    :model-value="model"
    @update:model-value="onInput"
    type="tel"
    inputmode="numeric"
    :maxlength="currentCountry.maxLength"
    :placeholder="t('components.phoneNumberField.placeholder')"
    :center="false"
    :readonly="readonly"
    :rules="rules"
    :name="name"
  >
    <template #label>
      <van-space
        class="text-primary cursor-pointer"
        align="center"
        :size="2"
        @click="onAreaCodeClick"
      >
        <span class="font-display text-22 font-bold tracking-wide">
          {{ currentCountry.iso }}
        </span>
        <van-icon name="arrow-down" v-if="!readonly" />
        <span> +{{ areaCode }} </span>
      </van-space>
    </template>
  </van-field>

  <!-- Hint de formato: evita 0/15/+54 y aclara los dígitos esperados. -->
  <p v-if="!readonly" class="phone-hint">{{ phoneHint }}</p>

  <!-- 区号选择器 -->
  <van-popup v-model:show="showAreaPicker" position="bottom" round>
    <van-picker
      :columns="areaCodeColumns"
      @confirm="onAreaCodeConfirm"
      @cancel="showAreaPicker = false"
      :title="t('components.phoneNumberField.selectAreaCode')"
      show-toolbar
    >
      <template #option="option">
        <van-space align="center" :size="10">
          <span class="font-display text-22 font-bold tracking-wide text-primary">
            {{ option.iso }}
          </span>
          <span>{{ option.text }}</span>
          <span class="text-text-secondary">+{{ option.value }}</span>
        </van-space>
      </template>
    </van-picker>
  </van-popup>
</template>

<style scoped>
:deep(.van-field__label) {
  width: auto;
}

/* Hint discreto bajo el input, alineado con el padding del van-field. */
.phone-hint {
  margin: 4px 0 0;
  padding: 0 16px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-secondary, rgba(255, 255, 255, 0.55));
}
</style>

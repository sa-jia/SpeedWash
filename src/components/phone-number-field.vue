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
    class="field-well phone-field"
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
      <!-- Chip de país: se pinta como botón (tinte celeste + borde) para que
           se distinga del pozo neutro del input que tiene al lado. Antes los
           dos compartían el fondo de la tarjeta y no se entendía cuál tocar
           para escribir y cuál para cambiar el país. -->
      <span
        class="country-chip"
        :class="{ 'country-chip--static': readonly }"
        role="button"
        :tabindex="readonly ? -1 : 0"
        @click="onAreaCodeClick"
        @keydown.enter.prevent="onAreaCodeClick"
        @keydown.space.prevent="onAreaCodeClick"
      >
        <span class="font-display country-chip__iso">
          {{ currentCountry.iso }}
        </span>
        <span class="country-chip__code">+{{ areaCode }}</span>
        <van-icon name="arrow-down" v-if="!readonly" class="country-chip__caret" />
      </span>
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
  margin-right: 10px;
}

/* Chip y pozo arrancan a la misma altura. Top-aligned y no centrado: si
   aparece el mensaje de error el bloque de la derecha crece hacia abajo, y
   con `center` el chip quedaría flotando a mitad de camino. */
.phone-field :deep(.van-cell__value) {
  min-width: 0;
}

.country-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 10px 10px;
  border-radius: 10px;
  background: rgba(var(--primary-color-rgb), 0.1);
  border: 1px solid rgba(var(--primary-color-rgb), 0.3);
  color: var(--primary-color);
  cursor: pointer;
  user-select: none;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.country-chip:hover,
.country-chip:focus-visible {
  background: rgba(var(--primary-color-rgb), 0.18);
  border-color: var(--primary-color);
  outline: none;
}

.country-chip:active {
  background: rgba(var(--primary-color-rgb), 0.26);
}

/* En modo readonly (ej. cambiar contraseña, donde el número ya está fijo)
   el chip no se toca: gris y sin cursor de botón. */
.country-chip--static {
  background: transparent;
  border-color: transparent;
  color: var(--text-secondary);
  cursor: default;
}

.country-chip__iso {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
}

.country-chip__code {
  font-size: 14px;
  line-height: 1;
}

.country-chip__caret {
  font-size: 11px;
  opacity: 0.8;
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

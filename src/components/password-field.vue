<script setup>
// Campo de contraseña con toggle de visibilidad (ojito).
// Wrapper sobre <van-field> que mantiene API compatible: acepta los
// mismos props que van-field y permite el slot por defecto. Cualquier
// reemplazo de <van-field type="password" ...> por <password-field ...>
// funciona sin más cambios.

defineOptions({ inheritAttrs: false });

const model = defineModel({ type: String, default: "" });

const visible = ref(false);
const toggle = () => {
  visible.value = !visible.value;
};
</script>

<template>
  <van-field
    v-model="model"
    v-bind="$attrs"
    :type="visible ? 'text' : 'password'"
  >
    <template #right-icon>
      <van-icon
        :name="visible ? 'eye-o' : 'closed-eye'"
        class="password-field__toggle"
        @click="toggle"
      />
    </template>
  </van-field>
</template>

<style scoped>
.password-field__toggle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  padding: 2px;
}

.password-field__toggle:active {
  color: var(--primary-color, #00bbfc);
}
</style>

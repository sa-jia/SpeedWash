<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <van-cell-group inset class="!mt-16px">
    <van-cell 
      :title="t('routes.settings.items.nickname')"
      is-link 
      to="/settings/nickname" 
      center 
    />
    <van-cell 
      :title="t('routes.settings.items.changePassword')"
      is-link 
      to="/settings/change-password" 
      center 
    />
  </van-cell-group>
</template>

<style scoped></style>

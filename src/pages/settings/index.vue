<script setup>
import { useI18n } from "vue-i18n";
const router = useRouter();
const { t } = useI18n();
const userStore = useUserStore();

const handleLogout = () => {
  showDialog({
    title: t("routes.settings.logout.title"),
    message: t("routes.settings.logout.message"),
    showCancelButton: true,
  }).then(() => {
    userStore.logout();
    router.push("/login");
  });
};
</script>

<template>
  <div class="settings">
    <van-cell-group inset class="!mt-16px">
      <van-cell :title="t('routes.settings.items.nickname')" is-link to="/settings/nickname" center />
      <van-cell :title="t('routes.settings.items.changePassword')" is-link to="/settings/change-password" center />
      <van-cell :title="t('routes.settings.items.aboutUs')" is-link to="/settings/aboutus" center />
    </van-cell-group>
  </div>

  <van-action-bar>
    <van-action-bar-button type="primary" :text="t('routes.settings.logout.button')" @click="handleLogout" />
  </van-action-bar>

</template>

<style scoped>

.button-group {
  padding: 16px;
  margin-top: auto;
}

.logout-btn {
  margin-bottom: 12px;
}

.delete-btn {
  color: #969799;
}
</style>

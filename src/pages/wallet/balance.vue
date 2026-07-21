<script setup>
import BalanceList from "@/components/balance/balance-list.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const now = new Date();

const currentDate = ref([`${now.getFullYear()}`, `${now.getMonth() + 1}`]);
const showPicker = ref(false);

const selectedYear = computed(() => currentDate.value[0]);
const selectedMonth = computed(() => currentDate.value[1]);

const formatDate = (date) => {
  const d = new Date(date);
  return t('routes.wallet.balance.datePicker.format', {
    year: d.getFullYear(),
    month: d.getMonth() + 1
  });
};

const onConfirm = ({ selectedValues }) => {
  showPicker.value = false;
};
</script>

<template>
  <div class="balance-page">
    <div class="balance-filter">
      <van-button
        round
        size="small"
        class="balance-filter__btn"
        @click="showPicker = true"
      >
        <span>{{ formatDate(currentDate) }}</span>
        <van-icon name="arrow-down" size="12" />
      </van-button>
    </div>

    <van-popup v-model:show="showPicker" position="bottom" round>
      <van-date-picker
        :columns-type="['year', 'month']"
        v-model="currentDate"
        :title="t('routes.wallet.balance.datePicker.title')"
        :min-date="new Date(2024, 11)"
        :max-date="new Date()"
        @confirm="onConfirm"
        @cancel="showPicker = false"
      />
    </van-popup>

    <balance-list :year="selectedYear" :month="selectedMonth" />
  </div>
</template>

<style scoped>
.balance-page {
  background: var(--background-color);
  min-height: 100vh;
}

.balance-filter {
  padding: 12px 16px;
}

.balance-filter__btn {
  background: var(--surface-2) !important;
  color: #00BBFC !important;
  border: 1px solid rgba(0, 187, 252, 0.3) !important;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
}
</style>

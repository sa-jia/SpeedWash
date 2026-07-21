<script setup>
import { ref } from "vue";
import { myPageApi } from "@/api";
import { useDateFormat } from "@vueuse/core";

const props = defineProps({
  year: {
    type: Number,
  },
  month: {
    type: Number,
  },
});

const loading = ref(false);
const refreshing = ref(false);
const balanceList = ref([]);
const finished = ref(false);

// 分页参数
const pageNo = ref(1);
const pageSize = ref(20);

const { t } = useI18n()

// 格式化金额显示
const formatAmount = (amount) => {
  return `$ ${(amount / 100).toFixed(2)}`;
};
 
// 获取变更类型文本
const getChangeTypeText = (type) => {
  const typeMap = {
    1: t('components.balance.changeType.adminModify'),
    2: t('components.balance.changeType.topUp'),
    3: t('components.balance.changeType.carWashConsumption'),
    4: t('components.balance.changeType.carWashRefund'),
  };
  return typeMap[type] || '';
};

// 格式化时间显示
const formatDate = (timestamp) => {
  return useDateFormat(new Date(timestamp), "YYYY-MM-DD HH:mm").value;
};

// 加载余额变化记录
const loadBalanceLogs = async (isRefresh = false) => {
  if (isRefresh) {
    pageNo.value = 1;
    finished.value = false;
    balanceList.value = [];
  }

  loading.value = true;

  const requestParams = props.year && props.month ? {
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    year: props.year,
    month: props.month,
  } : {
    pageNo: pageNo.value,
    pageSize: pageSize.value,
  }

  const { data, error } = await myPageApi.balanceLogPage(requestParams);

  loading.value = false;
  if (isRefresh) {
    refreshing.value = false;
  }

  if (unref(error)) {
    showToast(unref(error));
    finished.value = true;
    return;
  }

  balanceList.value.push(...unref(data).dataList);

  if (balanceList.value.length >= unref(data).total) {
    finished.value = true;
  } else {
    pageNo.value++;
  }
};

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true;
  await loadBalanceLogs(true);
};

// 监听年月变化
watch(
  () => [props.year, props.month],
  () => {
    loadBalanceLogs(true);
  }
);

// 初始加载
onMounted(() => {
  loadBalanceLogs(true);
});
</script>

<template>
  <van-pull-refresh class="flex-1" v-model="refreshing" @refresh="onRefresh">
    <van-list
      v-model:loading="loading"
      :finished="finished"
      :finished-text="t('common.noMoreData')"
      @load="loadBalanceLogs"
    >
      <div class="flex flex-col gap-4">
        <template v-for="item in balanceList" :key="item.createTimestamp">
          <van-cell-group inset>
            <van-cell
              :title="getChangeTypeText(item.changeType)"
            >
              <template #value>
                <price-tag :price="item.changeAmount" show-sign :show-currency="false" />
              </template>
            </van-cell>
            <van-cell
              :title="formatDate(item.createTimestamp)"
            >
              <template #value>
               {{ t('components.balance.title') }} <price-tag :price="item.afterChange" />
              </template>
            </van-cell>
          </van-cell-group>
        </template>
      </div>
    </van-list>
  </van-pull-refresh>
</template>

<style scoped>
</style>

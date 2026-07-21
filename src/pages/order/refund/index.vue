<script setup>
const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const reason = ref("");

// 获取订单ID
const { id } = route.params;

const { data, error } = orderApi.washOrderInfo(id);

const { urlList, afterRead, downloadUrlMap, fileList } = useUpload({
  type: "REFUND",
});

// 订单详情
const refundInfo = ref({
  rejectReason: "无",
  washMode: "",
  vipCard: "",
  actualPay: "",
});

// 获取订单详情
// const getOrderInfo = async () => {
//   try {
//     const { data } = await orderApi.washOrderInfo(orderId);
//     refundInfo.value = {
//       rejectReason: "无", // 退款驳回原因默认无
//       washMode: data.markName, // 洗车模式
//       vipCard: data.cardName || "未使用", // VIP卡使用情况
//       actualPay: (data.finalPrice / 100).toFixed(2), // 实际支付金额,转换为元并保留2位小数
//     };
//   } catch (error) {
//     showToast("获取订单信息失败");
//   }
// };
// 返回上一页
const onBack = () => router.back();

// 提交退款申请
const onSubmit = async () => {
  const { error } = await orderApi.washOrderApplyRefund({
    orderId: id,
    reason: reason.value,
    reasonPicList: urlList.value,
  });

  if (unref(error)) {
    showToast(unref(error));
    return;
  }
  showToast(t("routes.order.refund.success"));
  router.back();
};

// 页面加载时获取订单详情
// onMounted(() => {
//   getOrderInfo();
// });
</script>

<template>
  <van-form @submit="onSubmit">
    <div class="pt-16px pb-safe-bottom">
      <van-space class="mt-4" direction="vertical" fill>
        <van-cell-group inset>
          <van-cell :title="t('routes.order.refund.washMode')" :value="data?.markName" />
          <van-cell 
            :title="t('routes.order.refund.vipCard.title')" 
            :value="data?.cardName || t('routes.order.refund.vipCard.notUsed')" 
          />
          <van-cell 
            :title="t('routes.order.refund.actualPay')"
          >
            <template #value>
              <price-tag :price="data?.finalPrice" />
            </template>
          </van-cell>
        </van-cell-group>

        <van-cell-group inset>
          <van-cell :border="false">
            <template #title>
              <div>
                <span>{{ t('routes.order.refund.description.title') }}</span>
                <span class="text-red">{{ t('routes.order.refund.description.required') }}</span>
              </div>
            </template>

            <template #label>
              <div class="bg-surface-2 rounded-lg">
                <van-field
                  name="reason"
                  v-model="reason"
                  type="textarea"
                  autosize
                  :placeholder="t('routes.order.refund.description.placeholder')"
                  rows="3"
                  border="false"
                  maxlength="100"
                  show-word-limit
                  class="!bg-transparent !p-0"
                  :rules="[{ required: true, message: t('routes.order.refund.description.validation') }]"
                />

                <div class="p-4">
                  <app-uploader
                    v-model="fileList"
                    :max-count="5"
                    :multiple="true"
                    :after-read="afterRead"
                  >
                    <div class="upload-box w-[88px] h-[88px] border border-dashed border-[#999] rounded flex-center flex-col">
                      <van-icon name="photograph" size="24" class="mb-1 text-[#999]" />
                      <div class="text-12px text-[#999]">{{ t('routes.order.refund.upload.title') }}</div>
                      <div class="text-12px text-[#999]">{{ t('routes.order.refund.upload.maxCount') }}</div>
                    </div>
                  </app-uploader>
                </div>
              </div>
            </template>
          </van-cell>

          <van-cell :title="t('routes.order.refund.amount.title')">
            <template #label>
              <div class="text-error text-24px font-bold py-5">
                <price-tag :price="data?.finalPrice" />
              </div>
              <div class="text-error text-14px mt-2">
                {{ t('routes.order.refund.amount.notice') }}
              </div>
              <div class="text-gray-400 text-14px mt-1">
                {{ t('routes.order.refund.amount.disclaimer') }}
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </van-space>
    </div>

    <van-action-bar>
      <van-action-bar-button 
        type="primary" 
        native-type="submit"
      >{{ t('routes.order.refund.submit') }}</van-action-bar-button>
    </van-action-bar>
  </van-form>
</template>

<style scoped>
:deep(.van-cell) {
  padding: 16px !important;
}

:deep(.van-field__control) {
  background: transparent;
}

:deep(.van-field) {
  border: none;
  padding: 0;
}

:deep(.van-field__control) {
  background: transparent !important;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

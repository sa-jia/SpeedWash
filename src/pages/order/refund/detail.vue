<script setup>
import { orderApi } from "@/api";

const { t } = useI18n();
const route = useRoute();
const refundId = route.params.id;

// 退款详情数据
const {
  data: refundInfo,
  error,
  isFetching: loading,
} = orderApi.washOrderRefundInfo(refundId);
if (error.value) {
  showToast(t("routes.errors.networkError"));
}

// 获取退款状态文本
const refundStatusText = computed(() => {
  const status = refundInfo.value?.refundStatus || 'unknown';
  return t(`routes.order.refund.status.${status}`);
});
</script>

<template>
  <div class="refund-detail">
    <van-loading v-if="loading" />

    <template v-else>
      <van-cell-group inset class="!mt-20px">
        <!-- 退款状态 -->
        <van-cell :title="t('routes.order.refund.detail.status')" :value="refundStatusText" />

        <!-- 退款金额 -->
        <van-cell :title="t('routes.order.refund.detail.amount')">
          <template #value>
            <price-tag :price="refundInfo?.refundPrice" />
          </template>
        </van-cell>

        <!-- 订单金额 -->
        <van-cell :title="t('routes.order.refund.detail.orderAmount')">
          <template #value>
            <price-tag :price="refundInfo?.orderFinalPrice" />
          </template>
        </van-cell>

        <!-- VIP卡信息 -->
        <van-cell
          v-if="refundInfo?.cardName"
          :title="t('routes.order.refund.detail.voucherUsed')"
          :value="refundInfo?.cardName"
        />

        <!-- 申请原因 -->
        <van-cell :title="t('routes.order.refund.detail.reason')" :value="refundInfo?.applyReason" />

        <!-- 拒绝原因 -->
        <van-cell
          v-if="refundInfo?.refundStatus === 3"
          :title="t('routes.order.refund.detail.rejectReason')"
          :value="refundInfo?.denyReason"
        />

        <!-- 申请图片 -->
        <template v-if="refundInfo?.applyReasonPic">
          <van-cell :title="t('routes.order.refund.detail.images')">
            <template #value>
              <div class="p-4 flex flex-wrap gap-3">
                <van-image
                  v-for="(img, index) in refundInfo.applyReasonPic.split(',')"
                  :key="index"
                  :src="img"
                  width="100"
                  height="100"
                  radius="4"
                  fit="cover"
                />
              </div>
            </template>
          </van-cell>
        </template>
      </van-cell-group>
    </template>
  </div>
</template>

<style scoped>
:deep(.van-cell__title) {
  flex: none;
  width: 5em;
  color: #666;
}

:deep(.van-cell__value) {
  color: #333;
  text-align: left;
}
</style>

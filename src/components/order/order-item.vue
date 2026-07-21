<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps({
  // 订单数据
  order: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["contact", "pay", "detail", "click"]);

// 获取状态样式
const getStatusStyle = (status) => {
  const styleMap = {
    completed: "text-success",
    pending: "text-accent",
    processing: "text-primary",
    refund: "text-error",
  };
  return styleMap[status] || "";
};

// 操作事件处理
const handleContact = () => emit("contact", props.order);
const handlePay = () => emit("pay", props.order);
const handleDetail = () => emit("detail", props.order);
const handleClick = () => emit("click", props.order);

// 是否显示去付款按钮
const showPayButton = computed(() => {
  return props.order.status !== "refund" && props.order.showState === 1;
});

// El pack VIP cubrió el lavado → "$0" es confuso. Mostramos etiqueta en vez.
// Nota: el backend `washOrderPage` NO devuelve `cardName` (sí lo hace en
// `washOrderInfo`). Workaround: si un pedido está Completado (showState=5)
// y price=0, la única forma de haber llegado ahí es con pack. Ver
// CHANGELOG.md → pendientes backend.
const coveredByPack = computed(
  () => props.order.price === 0 && props.order.showState === 5
);
</script>

<template>
  <van-cell-group inset @click="handleClick">
    <van-cell :title="order.createTime" :value="order.orderNo" :border="false">
      <template #title>
        <span class="order-time">{{ order.createTime }}</span>
      </template>
      <template #value>
        <span
          :class="['order-status text-primary', getStatusStyle(order.status)]"
        >
          {{ t(`components.orderItem.status.${Number(order.showState)}`) }}
        </span>
      </template>
    </van-cell>
    <van-cell :border="false" class="order-content">
      <template #title>
        <div class="store-name">{{ order.storeName }}</div>
      </template>
      <template #value>
        <div v-if="coveredByPack" class="covered-by-pack">
          {{ t('routes.order.detail.covered_by_pack') }}
        </div>
        <price-tag v-else :price="order.price" />
      </template>

      <template #label>
        <div class="service-type">{{ order.serviceType }}</div>
      </template>
    </van-cell>
    <van-cell :border="false">
      <template #value>
        <van-space align="center">
          <!-- Contacto por WhatsApp: reemplaza al viejo botón "Contactar"
               que marcaba teléfono, y al de "Solicitar reembolso" que abría
               un formulario que nadie procesa (modelo manual hasta apertura). -->
          <van-button
            size="small"
            round
            color="#25D366"
            icon="chat-o"
            @click.stop="handleContact"
          >
            {{ t('components.orderItem.actions.contact') }}
          </van-button>

          <!-- 去付款 -->
          <van-button
            v-if="showPayButton"
            size="small"
            type="primary"
            round
            @click.stop="handlePay"
          >
            {{ t('components.orderItem.actions.pay') }}
          </van-button>
        </van-space>
        <slot name="actions" :order="order" />
      </template>
    </van-cell>
  </van-cell-group>
</template>

<style scoped>

.order-time {
  color: #666;
  font-size: 14px;
}

.order-status {
  font-weight: 500;
}

.order-content {
  /* margin-bottom: 12px; */
  --van-cell-vertical-padding: 0;
}

.store-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.covered-by-pack {
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-success);
  text-align: right;
}

.service-type {
  /* color: #666;
  font-size: 14px; */
}

.order-price {
  font-size: 16px;
  font-weight: 500;
  margin-top: 8px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #f5f5f5;
}

.order-number {
  color: #999;
  font-size: 12px;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.order-detail {
  text-align: right;
  margin-top: 8px;
}

.detail-link {
  color: #00BBFC;
  font-size: 14px;
}

:deep(.van-button--small) {
  padding: 0 12px;
}
</style>

<script setup>
import { PAYMENT_FROM } from "@/constants";
import { whatsappUrl } from "@/constants/contact";

const router = useRouter();
const { getOrderList, getOrderCounts } = useOrder();
const { t } = useI18n();

const { query } = useRoute();
// 标签页相关

const tabs = [
  { title: t("routes.order.index.tabs.1"), value: 1 },
  { title: t("routes.order.index.tabs.2"), value: 2 },
  { title: t("routes.order.index.tabs.3"), value: 3 },
  { title: t("routes.order.index.tabs.4"), value: 4 },
];

const activeTab = ref(
  tabs.find((tab) => tab.value === +query.status)?.value || 1
);

// Contador de cada pestaña. `null` = todavía no lo sabemos (o falló la
// llamada) → la pestaña se muestra sin número, nunca con un 0 inventado.
const counts = ref(
  tabs.reduce((acc, tab) => ({ ...acc, [tab.value]: null }), {})
);

const loadCounts = async () => {
  counts.value = await getOrderCounts(tabs.map((tab) => tab.value));
};

// 列表相关
const refreshing = ref(false);
const loading = ref(false);
const finished = ref(false);
const error = ref(false);
const pageNo = ref(1);
const pageSize = 10;
const orders = ref([]);

// 刷新列表
const onRefresh = async () => {
  // 如果正在加载，则不执行刷新
  if (loading.value) return;

  refreshing.value = true;
  pageNo.value = 1;
  finished.value = false;
  error.value = false;
  orders.value = [];
  
  try {
    await loadOrders();
  } finally {
    refreshing.value = false;
  }
};

// 加载更多
const onLoad = async () => {
  // 如果正在刷新，则不执行加载更多
  if (refreshing.value) return;

  await loadOrders();
};

// 加载订单数据
const loadOrders = async () => {
  if (loading.value || finished.value) return;

  loading.value = true;
  try {
    const { total, list } = await getOrderList({
      pageNo: pageNo.value,
      pageSize,
      state: activeTab.value,
    });

    // La lista ya nos trae el total del filtro activo: lo aprovechamos para
    // mantener ese contador al día sin pedir otra vez.
    if (typeof total === "number") counts.value[activeTab.value] = total;

    orders.value.push(...list);
    finished.value = orders.value.length >= total;
    if (!finished.value) pageNo.value++;
  } catch (err) {
    error.value = true;
    console.error("加载订单列表失败:", err);
  } finally {
    loading.value = false;
  }
};

// Contacto por WhatsApp con el contexto del pedido pre-armado. El detalle
// completo (sucursal/máquina/pago) lo tenemos en `washOrderInfo`; acá en la
// lista solo tenemos lo básico, así lo llenamos con lo que hay y "-" el resto.
// Workaround: el endpoint de lista no devuelve `cardName` — si es Completado
// con price=0, asumimos pack (mismo criterio que la etiqueta visual).
const handleContact = (order) => {
  const coveredByPack = order.price === 0 && order.showState === 5;
  const amount = coveredByPack
    ? t("routes.order.detail.covered_by_pack")
    : `$${Math.round((order.price || 0) / 100).toLocaleString("es-AR")}`;
  const payment = coveredByPack
    ? t("routes.order.detail.payment_methods.packGeneric")
    : "-";

  // Pagó y la máquina no arrancó (showState 3) → el mensaje sale redactado
  // como reclamo, no como consulta genérica.
  const template =
    order.showState === 3
      ? "routes.order.detail.whatsapp_claim_message"
      : "routes.order.detail.whatsapp_message";

  const msg = t(template, {
    orderNo: order.orderNo || order.orderId,
    date: order.createTime || "-",
    store: order.storeName || "-",
    machine: "-",
    mode: order.serviceType || "-",
    payment,
    amount,
  });
  window.location.href = whatsappUrl(msg);
};

const handlePay = ({ orderId: oid}) => {
  router.push({
    path: "/order/payment",
    query: {
      oid,
      from: PAYMENT_FROM.ORDER,
    },
  });
};

const handleDetail = (order) => {
  // 查看详情
  router.push(`/order/${order.orderId}`);
};

function handleClick(order) {
  router.push(`/order/${order.orderId}`);
}

// Tirar para refrescar: además de la lista, recalculamos todos los contadores
// (pagar un pedido mueve el número de dos pestañas, no solo de la activa).
// No lo esperamos: el contador no tiene por qué demorar el refresh de la lista.
const onPullRefresh = async () => {
  loadCounts();
  await onRefresh();
};

// 切换标签时刷新
watch(activeTab, () => {
  onRefresh();
});

// 初始加载
onMounted(() => {
  loadCounts();
  onRefresh();
});
</script>

<template>
  <div class="order-container h-default flex flex-col">
    <!-- 订单状态切换 -->
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab v-for="tab in tabs" :key="tab.value" :name="tab.value">
        <template #title>
          {{ tab.title }}
          <span v-if="counts[tab.value] !== null" class="tab-count">
            ({{ counts[tab.value] }})
          </span>
        </template>
      </van-tab>
    </van-tabs>

    <!-- TODO: 订单列表高度, 滑动不正常 iOS, 安卓好一些 -->
    <div class="flex-1 !overflow-y-auto flex flex-col">
      <!-- 订单列表 -->
      <van-pull-refresh
        v-model="refreshing"
        @refresh="onPullRefresh"
        :success-text="t('common.refreshSuccess')"
        class="flex-1"
      >
        <van-list
          v-model:loading="loading"
          :finished="finished"
          :error="error"
          :finished-text="t('common.noMore')"
          :error-text="t('common.loadError')"
          @load="onLoad"
        >
          <div class="py-4 flex flex-col gap-4">
            <order-item
              v-for="order in orders"
              :key="order.orderNo"
              :order="order"
              @contact="handleContact"
              @pay="handlePay"
              @detail="handleDetail"
              @click="handleClick"
            >
              <template #actions>
                <slot name="actions" :order="order" />
              </template>
            </order-item>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<style scoped>
/* El contador acompaña al nombre de la pestaña sin competirle: mismo color,
   un punto más chico y semitransparente. La pestaña activa lo hereda en
   primary junto con el título. */
.tab-count {
  font-size: 0.85em;
  opacity: 0.65;
  margin-left: 1px;
}
</style>

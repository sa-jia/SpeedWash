import { washApi, vipCardApi, topUpApi } from "@/api";
import { TIMEOUT } from "@/constants";

/**
 * 洗车订单支付
 * @param {number} orderId - 订单ID
 */
const washOrderPay = async (orderId) => {
  return await washApi.mercadoPagoPay(orderId);
};

/**
 * VIP 卡购买
 * @param {number} cardId - VIP卡 ID
 */
const vipCardPay = async (cardId) => {
  return await vipCardApi.newVipCardOrder(cardId);
};

/**
 * 充值支付
 * @param {Object} data
 * @param {number} [data.schemeId] - 方案ID,使用自定义金额时留空
 * @param {number} [data.amount] - 自定义充值金额,使用方案时留空
 */
const topUpPay = async (data) => {
  return await topUpApi.newOrder(data);
};

export function usePayment(initOptions) {
  const paymentContext = inject("SrPaymentProvider");

  const { from, oid } = initOptions;

  const loading = computed(() => paymentContext?.loading.value);

  const create = (options) => {
    return paymentContext?.create({
      from,
      oid,
      ...options,
    });
  };

  // function payResultCheck(orderId) {
  //   return washApi.payResultCheck(orderId);
  // }

  return {
    washOrderPay,
    vipCardPay,
    topUpPay,
    create,
    loading,
  };
}

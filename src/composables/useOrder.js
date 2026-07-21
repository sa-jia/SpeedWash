import { orderApi } from '@/api'

export function useOrder() {
  // 加载订单列表
  const getOrderList = async ({ pageNo, pageSize, state }) => {
    try {
      // 如果是退款订单，调用退款订单列表接口
      if (state === 5) {
        const { data, error } = await orderApi.washOrderRefundPage({
          pageNo,
          pageSize
        })
        
        if (unref(error)) throw error
        
        // 转换数据结构，统一返回格式
        const { total, dataList = [] } = unref(data) || {}
        return {
          total,
          list: dataList.map((item) => ({
            showState: item.showState,
            orderId: item.refundId,
            orderNo: item.orderNo,
            createTime: formatTimestamp(item.createTimestamp),
            storeName: item.storeName,
            serviceType: item.markName,
            price: item.finalPrice,
            status: "refund",
            statusText: getRefundStatusText(item.refundStatus),
            storePhone: item.storePhone,
          })),
        };
      }
      
      // 其他状态调用普通订单列表接口
      const { data, error } = await orderApi.washOrderPage({
        pageNo,
        pageSize,
        state
      })
      
      if (unref(error)) throw error
      
      const { total, dataList = [] } = unref(data) || {}
      return {
        total,
        list: dataList.map(item => ({
          isShowRefundBtn: item.isShowRefundBtn,
          orderId: item.orderId,
          orderNo: item.orderNo,
          createTime: formatTimestamp(item.createTimestamp),
          storeName: item.storeName,
          serviceType: item.markName,
          price: item.finalPrice,
          showState: item.showState,
          status: getOrderStatus(item.showState),
          statusText: getOrderStatusText(item.showState),
          storePhone: item.storePhone,
          canRefund: item.isShowRefundBtn === 1
        }))
      }
    } catch (err) {
      console.error('获取订单列表失败:', err)
      throw err
    }
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '.')
  }

  // 格式化价格
  const formatPrice = (price) => {
    if (typeof price !== 'number') return price
    return `$ ${(price / 100).toFixed(2)}`
  }

  // 获取订单状态
  const getOrderStatus = (showState) => {
    const statusMap = {
      1: 'pending',    // 待付款
      2: 'expired',    // 支付超时
      3: 'timeout',    // 洗车启动超时
      4: 'processing', // 进行中
      5: 'completed'   // 已完成
    }
    return statusMap[showState] || 'unknown'
  }

  // 获取订单状态文本
  const getOrderStatusText = (showState) => {
    const textMap = {
      1: '待付款',
      2: '支付超时',
      3: '启动超时',
      4: '洗车中',
      5: '已完成'
    }
    return textMap[showState] || '未知状态'
  }

  // 获取退款状态文本
  const getRefundStatusText = (refundStatus) => {
    const textMap = {
      1: '申请中',
      2: '处理中',
      3: '已拒绝',
      4: '退款成功',
      5: '退款失败'
    }
    return textMap[refundStatus] || '未知状态'
  }

  return {
    getOrderList
  }
} 
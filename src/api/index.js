// 洗车相关接口
const useWashApi = createApi("/user/wash");

export const washApi = {
  /** 
   * Mercado Pago支付订单
   * @param {number} orderId - 订单ID
   */
  mercadoPagoPay: (orderId) => useWashApi(`mercadoPagoPay/${orderId}`).post().json(),

  /** 
   * 新建洗车订单
   * @param {Object} data
   * @param {number} data.iotId - 洗车机ID
   * @param {number} data.mark - 洗车方案
   * @param {number} data.vipCardId - VIP卡ID
   */
  newOrder: (data) => useWashApi("newOrder").post(data).json(),

  /** 
   * 获取洗车机信息页面
   * @param {number} iotId - 洗车机ID
   */
  iotInfo: (iotId) => useWashApi(`iotInfo/${iotId}`).post().json(),

  /** 
   * 计算订单金额
   * @param {Object} data              
   * @param {number} data.iotId - 洗车机ID
   * @param {number} data.mark - 洗车方案
   * @param {number} data.vipCardId - VIP卡ID
   */
  calPrice: (data) => useWashApi("calPrice").post(data).json(),

  /** 
   * 余额支付订单
   * @param {number} orderId - 订单ID
   */
  balancePay: (orderId) => useWashApi(`balancePay/${orderId}`).post().json(),

  /** 
   * 检查支付结果和洗车进度
   * @param {number} orderId - 订单ID
   */
  payResultCheck: (orderId) => useWashApi(`payResultCheck/${orderId}`).post().json(),

  /** 
   * 获取订单信息
   * @param {number} orderId - 订单ID
   */
  orderInfo: (orderId) => useWashApi(`orderInfo/${orderId}`).post().json(),

  /** 
   * 申请退款
   * @param {Object} data - 退款申请数据
   */
  applyRefund: (data) => useWashApi("applyRefund").post(data).json(),

  /** 
   * 订单分页查询
   * @param {Object} data - 分页参数
   */
  orderPage: (data) => useWashApi("orderPage").post(data).json(),
};

// 订单相关接口
const useOrderApi = createApi("/user/order");

export const orderApi = {
  /** 
   * 洗车订单分页
   * @param {Object} data
   * @param {number} data.pageNo - 页码
   * @param {number} data.pageSize - 每页数量
   * @param {number} data.state - 状态筛选 1全部 2进行中 3待付款 4已完成
   */
  washOrderPage: (data) => useOrderApi("washOrderPage").post(data).json(),

  /** 
   * 洗车订单详情
   * @param {number} orderId - 订单ID
   */
  washOrderInfo: (orderId) => useOrderApi(`washOrderInfo/${orderId}`).post().json(),

  /** 
   * 洗车订单申请退款
   * @param {Object} data
   * @param {number} data.orderId - 订单ID
   * @param {string} data.reason - 申请原因
   * @param {string[]} data.reasonPicList - 原因配图
   */
  washOrderApplyRefund: (data) => useOrderApi("washOrderApplyRefund").post(data).json(),

  /** 
   * 退款订单分页
   * @param {Object} data
   * @param {number} data.pageNo - 页码
   * @param {number} data.pageSize - 每页数量
   */
  washOrderRefundPage: (data) => useOrderApi("washOrderRefundPage").post(data).json(),

  /** 
   * 退款订单详情
   * @param {number} refundId - 退款订单ID
   * @returns {Promise<Object>} 
   * @returns {string} data.applyReason - 退款申请原因
   * @returns {string} data.applyReasonPic - 退款申请原因图
   * @returns {string} data.denyReason - 拒绝原因
   * @returns {string} data.cardName - VIP卡名称
   * @returns {number} data.orderFinalPrice - 订单支付金额
   * @returns {number} data.refundPrice - 退款金额
   * @returns {number} data.refundStatus - 退款订单状态 1申请中;2已同意,处理中;3已拒绝;4退款成功;5退款失败
   */
  washOrderRefundInfo: (refundId) => useOrderApi(`washOrderRefundInfo/${refundId}`).post().json(),
};

// VIP卡相关接口
const useVipCardApi = createApi("/user/vipCard");

export const vipCardApi = {
  /** 
   * 下单购买VIP卡
   * @param {number} cardId - VIP卡ID
   */
  newVipCardOrder: (cardId) => useVipCardApi(`newVipCardOrder/${cardId}`).post().json(),

  /** 
   * 我拥有的VIP卡列表
   * @param {Object} data
   * @param {number} data.canUseType - 可用类型 1可使用 2已用完 3已过期
   * @returns {Promise<Array>} 返回VIP卡列表
   * @returns {number} data[].cardId - 卡ID
   * @returns {string} data[].cardName - 卡名称
   * @returns {number} data[].remainWashCount - 剩余次数
   * @returns {string} data[].expiryDate - 截止日期
   * @returns {number} data[].cardFrom - 来源 1邀请有礼 新人;2邀请有礼 老人;3后台赠送;4付费购买
   */
  myCardList: (data) => useVipCardApi("myCardList").post(data).json(),

  /** 
   * 获取可购买的VIP卡列表
   * @returns {Promise<Object>}
   * @returns {string[]} data.membership - 当前登陆用户已经完成认证的特殊身份
   * @returns {Array} data.canBuyList - 可购买的VIP卡列表
   */
  canBuyList: () => useVipCardApi("canBuyList").post().json(),

  /**
   * 绑定车牌号
   * @param {Object} data
   * @param {string} data.cardId - 卡id
   * @param {string} data.licenseNo - 车牌号
   */
  bindLicenseNo: (data) => useVipCardApi("bindLicenseNo").post(data).json(),
};

// 短信相关接口
const useSmsApi = createApi("/user/sms");

export const smsApi = {
  /** 
   * 重置密码发送短信
   * @param {Object} data
   * @param {string} data.phoneNum - 手机号
   */
  resetPwd: (data) => useSmsApi("resetPwd").post(data).json(),

  /** 
   * 注册发送短信
   * @param {Object} data
   * @param {string} data.phoneNum - 手机号
   */
  regedit: (data) => useSmsApi("regedit").post(data).json(),
};

// 充值相关接口
const useTopUpApi = createApi("/user/recharge");

export const topUpApi = {
  schemeList: () => useTopUpApi("rechargeSchemeList").post().json(),
  newOrder: (data) => useTopUpApi("newRechargeOrder").post(data).json(),
};

// '我的'页面相关接口
const useMyPageApi = createApi("/user/myPage");

export const myPageApi = {
  /** 
   * 设置密码
   * @param {Object} data
   * @param {string} data.pwd - 当前密码
   * @param {string} data.newPwd - 新密码
   */
  setPwd: (data) => useMyPageApi("setPwd").post(data).json(),

  /** 
   * 设置个人信息
   * @param {Object} data
   * @param {string} data.nickName - 昵称
   */
  setMyInfo: (data) => useMyPageApi("setMyInfo").post(data).json(),

  /** 
   * 获取我的信息
   * @returns {Promise<Object>}
   * @returns {string} data.phoneNum - 手机号
   * @returns {string} data.nickName - 昵称
   * @returns {number} data.balance - 余额
   */
  myInfo: () => useMyPageApi("myInfo").post().json(),

  /** 
   * 余额变化分页
   * @param {Object} data
   * @param {number} data.pageNo - 页码
   * @param {number} data.pageSize - 每页数量
   * @param {number} data.year - 年
   * @param {number} data.month - 月
   * @returns {Promise<Object>}
   * @returns {number} data.total - 总条数
   * @returns {Array} data.dataList - 数据列表
   * @returns {number} data.dataList[].createTimestamp - 创建时间
   * @returns {number} data.dataList[].changeType - 变更类型 1后台修改;2充值订单;3洗车消费;4洗车退款
   * @returns {number} data.dataList[].changeAmount - 变更量
   * @returns {number} data.dataList[].afterChange - 变更后余额
   */
  balanceLogPage: (data) => useMyPageApi("balanceLogPage").post(data).json(),
};

// 特殊身份相关接口
const useMembershipApi = createApi("/user/membership");

export const membershipApi = {
  myMembershipList: () => useMembershipApi("myMembershipList").post().json(),
  apply: (data) => useMembershipApi("apply").post(data).json(),
};

// 登录和注册相关接口
const useLoginApi = createApi("/user/login");

export const loginApi = {
  /** 
   * 重置密码
   * @param {Object} data
   * @param {string} data.phoneNum - 手机号
   * @param {string} data.smsCode - 短信验证码
   * @param {string} data.smsRequestId - 短信验证ID
   * @param {string} data.pwd - 密码
   */
  resetPwd: (data) => useLoginApi("resetPwd").post(data).json(),

  /** 
   * 注册账号
   * @param {Object} data
   * @param {string} data.phoneNum - 手机号
   * @param {string} data.smsCode - 短信验证码
   * @param {string} data.smsRequestId - 短信验证ID
   * @param {string} data.pwd - 密码
   * @param {string} data.inviteKey - 邀请码(选填)
   */
  regedit: (data) => useLoginApi("regedit").post(data).json(),

  /** 
   * 账号密码登录
   * @param {Object} data
   * @param {string} data.phoneNum - 手机号
   * @param {string} data.pwd - 密码
   */
  pwdLogin: (data) => useLoginApi("pwdLogin").post(data).json(),

  /**
   * 获取系统参数
   * @param {string} valKey - 参数键名 USER_SERVICE_CONTRACT|USER_ABOUT_US
   */
  getSysVal: (valKey) => useLoginApi(`getSysVal/${valKey}`).post().json(),
};

// 邀请有礼相关接口
const useInviteRewardApi = createApi("/user/inviteReward");

export const inviteRewardApi = {
  /**
   * 新被邀请用户查询受邀领取结果
   * @returns {Promise<Object>}
   * @returns {number} data.result - 受邀结果 1领取VIP卡成功;2不是新用户或未参加活动;3活动失效
   * @returns {string} data.vipCardName - 如果领取成功,VIP卡名称
   */
  newUserRegResult: () => useInviteRewardApi("newUserRegResult").post().json(),

  /**
   * 被邀请人页面信息
   * @param {string} inviteKey - 邀请码
   * @returns {Promise<Object>}
   * @returns {string} data.name - 活动名称
   * @returns {number} data.startTime - 活动开始时间
   * @returns {number} data.endTime - 活动结束时间
   * @returns {string} data.newUserPicUrl - 受邀人页面背景图
   */
  newUserPageInfo: (inviteKey) => useInviteRewardApi(`newUserPageInfo/${inviteKey}`).post().json(),

  /**
   * 创建新的邀请链接
   * @returns {Promise<Object>}
   * @returns {string} data.shareText - 分享文案
   */
  newInviteLink: () => useInviteRewardApi("newInviteLink").post().json(),

  /**
   * 发出的邀请记录
   * @returns {Promise<Array>}
   * @returns {string} data[].newUserPhoneNum - 受邀用户手机号
   * @returns {number} data[].inviteStatus - 受邀状态 1已注册未洗车 2已洗车
   */
  inviteLogList: () => useInviteRewardApi("inviteLogList").post().json(),

  /**
   * 邀请有礼活动页面信息
   * @returns {Promise<Object>}
   * @returns {string} data.name - 活动名称
   * @returns {number} data.needInviteCount - 需要邀请多少人才能拿到奖励
   * @returns {number} data.startTime - 活动开始时间
   * @returns {number} data.endTime - 活动结束时间
   * @returns {number} data.inviterMaxRewardTimes - 邀请人最多获取几次奖励
   * @returns {string} data.inviterPicUrl - 邀请人页面背景图
   * @returns {number} data.rewardCount - 已经获得的奖励次数
   * @returns {number} data.inviteSuccessCount - 已经成功邀请的人数
   */
  inviteIndex: () => useInviteRewardApi("inviteIndex").post().json(),
};

// 首页相关接口
const useIndexApi = createApi("/user/index");

export const indexApi = {
  /** 
   * 获取店铺列表
   * @returns {Promise<Array>} 返回店铺列表
   * @returns {number} data[].storeId - 店铺ID
   * @returns {string} data[].storeName - 店铺名称
   * @returns {string} data[].mainPic - 图片
   * @returns {string} data[].address - 地址
   * @returns {number} data[].lng - 经度
   * @returns {number} data[].lat - 纬度
   * @returns {number} data[].opening - 是否营业中 1是 0否
   */
  storeList: () => useIndexApi("storeList").post().json(),

  /** 
   * 检查是否有正在进行的洗车订单
   * @returns {Promise<Object>} 
   * @returns {number} data.orderId - 如果有洗车中的订单,该字段将有值
   */
  checkWashingOrder: () => useIndexApi("checkWashingOrder").post().json(),

  /** 
   * 获取首页banner
   * @returns {Promise<Array>}
   * @returns {string} data[].name - 名称
   * @returns {string} data[].picUrl - 图片URL
   */
  banner: () => useIndexApi("banner").post().json(),
};

// 文件上传相关接口
const useFileApi = createApi("/user/file");

export const fileApi = {
  /** 
   * 上传文件
   * @param {FormData} data - 文件数据
   */
  upload: (data) => useFileApi("upload").post(data).json(),

  /** 
   * 获取上传凭证
   * @param {Object} data
   * @param {string} data.type - 文件类型(MEMBERSHIP|BANNER|INVITE_REWARD_I|INVITE_REWARD_N|STORE_MAIN|REFUND)
   * @param {string} data.filename - 包含后缀的文件名
   * @returns {Promise<Object>}
   * @returns {string} data.url - 上传地址
   * @returns {string} data.method - 上传方法
   * @returns {Array<{key:string,value:any}>} data.formData - 表单数据
   * @returns {string} data.downloadUrl - 下载地址
   */
  getUploadKey: (data) => useFileApi("getUploadKey").post(data).json(),
};

// 店铺相关接口
const useStoreApi = createApi("/user/store");

export const storeApi = {
  /** 
   * 获取店铺详情
   * @param {number} id - 店铺ID
   * @returns {Promise<Object>} 店铺详情
   * @returns {number} data.storeId - 店铺ID
   * @returns {string} data.storeName - 店铺名称
   * @returns {string} data.mainPic - 店铺主图
   * @returns {string} data.address - 店铺地址
   * @returns {number} data.lng - 经度
   * @returns {number} data.lat - 纬度
   * @returns {number} data.opening - 是否营业中 1是 0否
   */
  detail: (id) => useStoreApi(`info/${id}`).post().json(),
};

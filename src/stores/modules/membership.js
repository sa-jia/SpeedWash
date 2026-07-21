import { defineStore } from "pinia";
import { membershipApi } from "@/api";

export const useMembershipStore = defineStore("membership", () => {

  const { t } = useI18n();
  // 状态
  const memberships = ref([]);
  // 可申请的列表
  const applicableMemberships = ref([]);
  // 当前申请中的身份
  const currentMembership = ref(null);

  // 是否是认证中
  const loading = ref(false);
  const error = ref(null);

  // actions
  const getMemberships = async () => {
    loading.value = true;
    error.value = null;

    const { data, error: apiError } = await membershipApi.myMembershipList();
    if (unref(apiError)) {
      error.value = apiError.message;
      return;
    }

    const { membershipList = [], myMembershipList = [] } = unref(data) || {};
    // 获取用户还未申请的身份类型
    applicableMemberships.value = membershipList.filter(membership => 
      !myMembershipList.some(myMembership => 
        myMembership.membershipType === membership.membershipType
      )
    );

    // 保存用户当前的所有身份状态
    memberships.value = myMembershipList;
    
    loading.value = false;
  };

  const applyMembership = async (data) => {
    const { error: apiError } = await membershipApi.apply(data);
    if (unref(apiError)) {
      error.value = unref(apiError);
      showFailToast(unref(error) || t("common.submitFailed"));
      return;
    }
    showSuccessToast(t("common.submitSuccess"));
    await getMemberships();
    return true;
  };

  // 设置当前申请中的身份
  const setCurrentMembership = (membership) => {
    currentMembership.value = membership;
  };

  // getters
  const getStatusText = (status) => {
    const statusMap = {
      1: t('routes.identity.status.pending'),
      2: t('routes.identity.status.rejected'),
      99: t('routes.identity.status.verified'),
    };
    return statusMap[status] || t('routes.identity.status.unverified');
  };

  // 检查是否有特定身份且已认证
  const hasVerifiedMembership = (type) => {
    return memberships.value.some(
      (item) => item.membershipType === type && checkStatus(item)
    );
  };

  // 获取已认证的身份列表
  const verifiedMemberships = computed(() =>
    memberships.value.filter(checkStatus)
  );

  // 获取未认证的身份列表
  const unverifiedMemberships = computed(() =>
    memberships.value.filter(item => !checkStatus(item))
  );

  // 检查身份是否已认证
  const checkStatus = (item) => {
    return item?.checkStatus === 99;
  };

  // 获取当前申请中的身份
  const getCurrentMembership = () => {
    return currentMembership.value;
  };

  return {
    // 状态
    memberships,
    loading,
    error,
    applicableMemberships,
    currentMembership,

    // actions
    getMemberships,
    applyMembership,
    setCurrentMembership,
    // getters
    getStatusText,
    hasVerifiedMembership,
    verifiedMemberships,
    unverifiedMemberships,
    checkStatus,
    getCurrentMembership,
  };
});

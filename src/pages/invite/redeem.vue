<script setup>
import getRewardImgCn from "@/assets/invite/get_reward_cn.png";
import getRewardImgEn from "@/assets/invite/get_reward_en.png";
import inviteBannerImgCn from "@/assets/invite/invite_banner_cn.png";
import inviteBannerImgEn from "@/assets/invite/invite_banner_en.png";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();
const { isZh } = useLocale();

const getRewardImg = computed(() => isZh.value ? getRewardImgCn : getRewardImgEn);
const inviteBannerImg = computed(() => isZh.value ? inviteBannerImgCn : inviteBannerImgEn);

const { data, error, isFetching } = inviteRewardApi.newUserRegResult();

// 将原有的 result 映射到 InviteStatus
const status = computed(() => {
  const result = unref(data)?.result || 0;
  const statusMap = {
    0: 1,  // 默认为正常状态
    1: 1,  // 领取VIP卡成功 -> NORMAL
    2: 4,  // 不是新用户 -> NOT_NEW_USER
    3: 3,  // 活动失效 -> EXPIRED
  };
  return statusMap[result];
});

// 领取奖励
function getReward() {
  router.push("/vouchers");
}

// 去邀请信息页
function goInviteInfo() {
  router.push("/invite/rewards");
}
</script>

<template>
  <invite-page-status :role="2" :status="status" @banner-click="goInviteInfo" :is-loading="isFetching" :error="error">
    <!-- 正常状态时的内容 -->
    <invite-header v-if="status === 1" :image="getRewardImg" @click="getReward">
      <span>{{ t('routes.invite.redeem.viewCard') }}</span>
    </invite-header>
  </invite-page-status>
</template>

<style scoped>
.invite-empty-img {
  top: calc(calc(var(--vw) * 52) * -1);
}

.invite-fail-img {
  top: calc(calc(var(--vw) * 82.5) * -1);
}
</style>

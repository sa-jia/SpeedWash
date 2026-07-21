<script setup>
import { inviteRewardApi } from "@/api";
import { useI18n } from "vue-i18n";
import { INVITE_ROLE, INVITE_STATUS } from "@/constants";
import useClipboard from 'vue-clipboard3'
const { toClipboard } = useClipboard()
const router = useRouter();
const { t } = useI18n();
const { data, error, isFetching } = inviteRewardApi.inviteIndex();

const { data: linkData, error: linkError } = inviteRewardApi.newInviteLink();

if (unref(error)) {
  showToast(unref(error));
}

// 计算活动状态
const status = computed(() => {
  const inviteData = unref(data);
  if (!inviteData?.name) {
    return INVITE_STATUS.NOT_EXIST; // NOT_EXIST - 活动不存在
  }

  const now = Date.now();
  if (now < inviteData.startTime) {
    return INVITE_STATUS.NOT_STARTED; // NOT_STARTED - 活动未开始
  }
  if (now > inviteData.endTime) {
    return INVITE_STATUS.EXPIRED; // EXPIRED - 活动已结束
  }
  if (inviteData.rewardCount >= inviteData.inviterMaxRewardTimes) {
    return INVITE_STATUS.NO_REWARD; // NO_REWARD - 已达到奖励上限
  }
  return INVITE_STATUS.NORMAL; // NORMAL - 正常状态
});

// 生成新的邀请链接
const generateInviteLink = async () => {
  
  if (!unref(linkError)) {
    try {
      await toClipboard(unref(linkData).shareText);
      showToast(t('routes.invite.rewards.linkCopied'));
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      showToast(t('routes.invite.rewards.copyFailed'));
    }
    return;
  }
  showToast(unref(linkError));
};

function toInviteRewards() {
  router.push("/vouchers");
}

function toInviteRecord() {
  router.push("/invite/record");
}
</script>

<template>
  <invite-page-status :role="INVITE_ROLE.INVITER" :status="status" :is-loading="isFetching" :error="error">
    <!-- 正常状态时的内容 -->
    <template v-if="status === INVITE_STATUS.NORMAL">
      <!-- 邀请记录 -->
      <div
        class="mt-70 w-max p-r-10 h-44 absolute right--8 rounded-full bg-primary z-20 p-x-10px lh-none text-center text-white flex items-center text-2xl"
        @click="toInviteRecord">
        {{ t('routes.invite.rewards.record') }}
      </div>

      <invite-rewards :start-time="data?.startTime" :end-time="data?.endTime" :count="data?.needInviteCount"
        @click="generateInviteLink">
        <span>{{ t('routes.invite.rewards.inviteNow') }}</span>
      </invite-rewards>

      <invite-group :title="t('routes.invite.rewards.earnings.title')">
        <div class="flex flex-col gap-4 flex-1 justify-between">
          <div class="flex items-center p-y-5">
            <div class="left flex-1">
              <div class="flex flex-col items-center gap-2">
                <div class="flex text-6xl items-baseline">
                  {{ data?.rewardCount }}
                  <span class="text-2xl">{{ t('routes.invite.rewards.earnings.totalRewards.unit') }}</span>
                </div>
                <span>{{ t('routes.invite.rewards.earnings.totalRewards.label') }}</span>
              </div>
            </div>
            <van-divider vertical :style="{ borderColor: 'var(--primary-color)' }" />
            <div class="right flex-1">
              <div class="flex flex-col items-center gap-2">
                <div class="flex text-6xl items-baseline">
                  {{ data?.inviteSuccessCount }}
                  <span class="text-2xl">{{ t('routes.invite.rewards.earnings.successInvites.unit') }}</span>
                </div>
                <span>{{ t('routes.invite.rewards.earnings.successInvites.label') }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-center p-x-5">
            <van-button color="#FFF1AD" class="w-500 !text-primary !font-bold !text-3xl" round @click="toInviteRewards">
              {{ t('routes.invite.rewards.viewRewards') }}
            </van-button>
          </div>
        </div>
      </invite-group>
    </template>
  </invite-page-status>
</template>

<style scoped></style>

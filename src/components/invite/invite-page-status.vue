<script setup>
import getRewardImgCn from "@/assets/invite/get_reward_cn.png";
import getRewardImgEn from "@/assets/invite/get_reward_en.png";
import inviteBannerImgCn from "@/assets/invite/invite_banner_cn.png";
import inviteBannerImgEn from "@/assets/invite/invite_banner_en.png";
import inviteFailImg from "@/assets/invite/icon_invite_fail.png";
import inviteEmptyImg from "@/assets/invite/icon_invite_empty.png";
import PageStatus from "@/components/common/page-status.vue";
import { useI18n } from "vue-i18n";
import { INVITE_STATUS, INVITE_ROLE } from "@/constants";
const router = useRouter();
const { t } = useI18n();
const { isZh } = useLocale();

const props = defineProps({
  role: {
    type: Number,
    required: true,
  },
  status: {
    type: Number,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
});

// 正常状态 - 可以参与活动
const normalStatus = computed(() => props.status === INVITE_STATUS.NORMAL);

// 空状态 - 活动未开始/已结束/活动不存在  
const emptyStatus = computed(() => [
  INVITE_STATUS.NOT_STARTED,
  INVITE_STATUS.EXPIRED,
  INVITE_STATUS.NOT_EXIST,
].includes(props.status));

// 失败状态 - 不满足参与条件
const failStatus = computed(() => [
  INVITE_STATUS.NOT_NEW_USER,
  INVITE_STATUS.REGISTERED,
  INVITE_STATUS.NOT_QUALIFIED,
  INVITE_STATUS.NO_REWARD,
  INVITE_STATUS.NOT_COMPLETED,
  INVITE_STATUS.FORBIDDEN
].includes(props.status));

// 获取状态对应的文案
const statusMessage = computed(() => {
  const messages = {
    [INVITE_STATUS.NOT_EXIST]: t('components.invitePageStatus.notExist'),
    [INVITE_STATUS.NOT_STARTED]: t('components.invitePageStatus.notStarted'),
    [INVITE_STATUS.EXPIRED]: t('components.invitePageStatus.expired'),
    [INVITE_STATUS.NOT_NEW_USER]: t('components.invitePageStatus.notNewUser'),
    [INVITE_STATUS.REGISTERED]: t('components.invitePageStatus.registered'),
    [INVITE_STATUS.NOT_QUALIFIED]: t('components.invitePageStatus.notQualified'),
    [INVITE_STATUS.NO_REWARD]: props.role === INVITE_ROLE.INVITER 
      ? t('components.invitePageStatus.noReward.inviter')
      : t('components.invitePageStatus.noReward.invitee'),
    [INVITE_STATUS.NOT_COMPLETED]: t('components.invitePageStatus.notCompleted'),
    [INVITE_STATUS.FORBIDDEN]: t('components.invitePageStatus.forbidden'),
  };
  
  return messages[props.status] || '';
});

// 获取状态对应的图片
const statusImage = computed(() => {
  if (emptyStatus.value) {
    return inviteEmptyImg;
  }
  if (failStatus.value) {
    return inviteFailImg;
  }
  return '';
});

const inviteBannerImg = computed(() => isZh.value ? inviteBannerImgCn : inviteBannerImgEn);

const emit = defineEmits(["bannerClick"]);

</script>

<template>

  <page-status v-if="isLoading || error" :is-loading="isLoading" :error="error" />
  <invite-page v-else>
    <template v-if="normalStatus">
      <slot />
    </template>
    <div class="pt-200" v-else>
      <div
        class="relative ml-30 h-280 mr-30 bg-surface b-1 b-solid b-line rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] text-3xl font-bold text-text-primary text-center lh-normal">
        <img v-if="statusImage" :src="statusImage" :class="[
            emptyStatus ? 'h-141 w-226 invite-empty-img' : 'h-165 w-126 invite-fail-img',
            'absolute left-1/2 -translate-x-1/2 z-10'
          ]" />

        <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {{ statusMessage }}
        </span>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center mt-150px" @click="() => emit('bannerClick')"
      v-if="normalStatus && role === INVITE_ROLE.INVITEE">
      <van-image :src="inviteBannerImg" class="w-full" />
    </div>
  </invite-page>
</template>

<style scoped>
.invite-empty-img {
  top: calc(calc(var(--vw) * 52) * -1);
}

.invite-fail-img {
  top: calc(calc(var(--vw) * 82.5) * -1);
}
</style>

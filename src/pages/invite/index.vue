<script setup>
import { inviteRewardApi } from "@/api";
import { useI18n } from "vue-i18n";
import { INVITE_ROLE, INVITE_STATUS } from "@/constants";

const { t } = useI18n();
const { params } = useRoute();
const { code } = params;
const router = useRouter();

const { data, error } = inviteRewardApi.newUserPageInfo(code);

if (unref(error)) {
  showToast(unref(error));
}

// 计算活动状态
const status = computed(() => {
  const inviteData = unref(data);
  if (!inviteData?.name) {
    return INVITE_STATUS.NOT_EXIST; // 活动不存在
  }

  const now = Date.now();
  if (now < inviteData.startTime) {
    return INVITE_STATUS.NOT_STARTED; // 活动未开始
  }
  if (now > inviteData.endTime) {
    return INVITE_STATUS.EXPIRED; // 活动已结束
  }

  return INVITE_STATUS.NORMAL; // 正常状态
});

// 领取免费洗车
function getFreeWash() {
  router.replace(`/register?inviteCode=${code}`);
}
</script>

<template>
  <invite-page-status :role="INVITE_ROLE.INVITEE" :status="status">
    <!-- 正常状态时的内容 -->
    <template v-if="status === INVITE_STATUS.NORMAL">
      <invite-rewards
        :start-time="data?.startTime"
        :end-time="data?.endTime"
        @click="getFreeWash"
      >
        <span>{{ t('routes.invite.getFreeWash') }}</span>
      </invite-rewards>
    </template>
  </invite-page-status>
</template>

<style scoped>

</style>

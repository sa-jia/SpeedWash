<script setup>
import packsCn from "@/assets/invite/packs_cn.png";
import packsEn from "@/assets/invite/packs_en.png";
import inviteStep1 from "@/assets/invite/icon_invite_step1.png";
import inviteStep2 from "@/assets/invite/icon_invite_step2.png";
import inviteStep3 from "@/assets/invite/icon_invite_step3.png";

const { t, locale } = useI18n();
const { isZh } = useLocale();

// 根据语言选择图片
const packsImage = computed(() => isZh.value ? packsCn : packsEn);

const props = defineProps({
  startTime: {
    type: Number,
    default: 0,
  },
  endTime: {
    type: Number,
    default: 0,
  },
  count: {
    type: Number,
    default: 0,
  },
  // 是否显示活动信息卡片
  showActivityInfo: {
    type: Boolean,
    default: true,
  },
});

const startTimeFormatted = useDateFormat(
  () => new Date(props.startTime),
  "YYYY-MM-DD HH:mm:ss",
  {
    locales: "zh_Hans_SG",
  }
);
const endTimeFormatted = useDateFormat(
  () => new Date(props.endTime),
  "YYYY-MM-DD HH:mm:ss",
  {
    locales: "zh_Hans_SG",
  }
);

const emit = defineEmits(["click"]);

</script>

<template>
  <invite-header :image="packsImage" @click="() => emit('click')">
    <slot />
  </invite-header>
  <!-- 活动信息卡片 -->
  <invite-group 
    :title="t('routes.invite.rewards.steps.title')" 
    v-if="showActivityInfo"
  >
    <div class="flex flex-col gap-4 flex-1 justify-between">
      <van-grid :border="false" :column-num="3" :icon-size="64" :center="true">
        <van-grid-item
          class="!justify-start"
          :icon="inviteStep1"
          :text="t('routes.invite.rewards.steps.step1')"
        />
        <van-grid-item
          class="!justify-start"
          :icon="inviteStep2"
          :text="t('routes.invite.rewards.steps.step2')"
        />
        <van-grid-item
          class="!justify-start"
          :icon="inviteStep3"
          :text="t('routes.invite.rewards.steps.step3', { count })"
        />
      </van-grid>

      <div
        class="h-60px w-full flex items-center justify-center flex-col text-primary gap-4"
      >
        <span class="text-2xl font-bold">{{ t('routes.invite.rewards.activityPeriod.title') }}</span>
        <span class="text-sm">
          {{ t('routes.invite.rewards.activityPeriod.time', {
            startTime: startTimeFormatted,
            endTime: endTimeFormatted
          }) }}
        </span>
      </div>
    </div>
  </invite-group>
</template>

<style scoped></style>

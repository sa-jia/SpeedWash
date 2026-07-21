<script setup>
import { inviteRewardApi } from '@/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n();

const { data, error, isFetching, execute } = inviteRewardApi.inviteLogList()
const onRefresh = () => {
  execute()
}

function progress(item) {
  return item.inviteStatus === 1 
    ? t('routes.invite.record.status.unused') 
    : t('routes.invite.record.status.used')
}

</script>

<template>
  <van-pull-refresh class="h-screen" :model-value="isFetching" @refresh="onRefresh">

    <div class="flex justify-between px-16px py-4 lh-snug text-26 font-bold">
      <span>{{ t('routes.invite.record.columns.user') }}</span>
      <span>{{ t('routes.invite.record.columns.progress') }}</span>
    </div>
    <div class="flex flex-col gap-4" v-if="data?.length > 0">
      <van-cell v-for="(item, index) in data" :key="index" :title="item.newUserPhoneNum" :value="progress(item)"
        :value-class="item.inviteStatus === 2 ? 'text-primary' : 'text-text-secondary'" />
    </div>
    <van-empty v-else class="mt-16px" :description="t('routes.invite.record.empty')" />
  </van-pull-refresh>
</template>

<style scoped></style>
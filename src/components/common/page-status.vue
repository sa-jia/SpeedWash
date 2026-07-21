<script setup>
const { t } = useI18n();

defineProps({
  isLoading: Boolean,
  error: String,
  loadingSize: {
    type: String,
    default: '24px'
  },
  errorIconSize: {
    type: [String, Number],
    default: 48
  },
  overlay: {
    type: Boolean,
    default: true
  }
});
</script>

<template>
  <template v-if="overlay">
    <!-- 加载状态 -->
    <div
      v-if="isLoading"
      class="fixed inset-0 z-10 flex-center bg-ink"
    >
      <van-loading :size="loadingSize" vertical>
        {{ t("common.loading") }}
      </van-loading>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="error"
      class="fixed inset-0 z-50 flex-center bg-ink"
    >
      <van-empty :description="error" image="error">
        <!-- <template #image>
          <van-icon 
            name="warning-o" 
            :size="errorIconSize" 
            class="text-gray-400" 
          />
        </template> -->
      </van-empty>
    </div>
  </template>
  <template v-else>
    <!-- 非覆盖模式 -->
    <van-loading
      v-if="isLoading"
      :size="loadingSize"
      vertical
      class="my-4"
    >
      {{ t("common.loading") }}
    </van-loading>

    <van-empty
      v-if="error"
      :description="error"
      class="my-4"
    >
      <template #image>
        <van-icon 
          name="warning-o" 
          :size="errorIconSize" 
          class="text-gray-400" 
        />
      </template>
    </van-empty>
  </template>
</template> 
<script setup>
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// 获取扫描结果
const scanResult = ref(route.query.result || '')
const resultType = ref('unknown') // 可能的类型: url, unknown
const isValidUrl = ref(false)
const isBackgroundUrl = ref(false)

// 验证扫描结果
const validateScanResult = () => {
  if (!scanResult.value) {
    showToast(t('routes.scan.invalidResult'))
    return false
  }

  try {
    const url = new URL(scanResult.value)
    resultType.value = 'url'
    isValidUrl.value = true
    return true
  } catch (e) {
    resultType.value = 'unknown'
    isValidUrl.value = false
    return true
  }
}

// 页面加载时验证
onMounted(() => {
  validateScanResult()
})

// 重新扫描
const reScan = () => {
  router.replace('/scan')
}

// 复制内容
const copyResult = () => {
  navigator.clipboard.writeText(scanResult.value)
    .then(() => {
      showToast(t('common.copied'))
    })
    .catch(() => {
      showToast(t('common.fail'))
    })
}
</script>

<template>
  <div class="scan-result">
    <!-- 扫描结果展示 -->
    <van-cell-group class="mb-4 !bg-transparent">
      <van-cell :title="t('routes.scan.scannedContent')" :title-class="['text-center']">
        <template #label>
          <div class="break-all text-center">
            {{ scanResult }}
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 安全提示 -->
    <div v-if="!isBackgroundUrl && scanResult" class="text-xl text-text-secondary mb-4 px-4 text-center fixed bottom-safe-50">
      {{ t('routes.scan.securityTip') }}
    </div>

    <!-- 操作按钮 -->
    <van-space direction="vertical" fill size="small" v-if="false">
      <template v-if="isValidUrl">
        <van-button 
          block 
          type="primary" 
          :href="scanResult" 
          target="_blank"
        >
          {{ t('routes.scan.openUrl') }}
        </van-button>
      </template>

      <van-button 
        block 
        @click="copyResult"
      >
        {{ t('common.copy') }}
      </van-button>

      <van-button 
        block 
        @click="reScan"
      >
        {{ t('routes.scan.scanAgain') }}
      </van-button>
    </van-space>


    <van-action-bar>
      <van-action-bar-button type="danger" @click="copyResult" v-if="scanResult"> {{ t('common.copy') }} </van-action-bar-button>
      <van-action-bar-button type="warning" @click="reScan"> {{ t('routes.scan.scanAgain') }} </van-action-bar-button>
    </van-action-bar>

  </div>
</template>

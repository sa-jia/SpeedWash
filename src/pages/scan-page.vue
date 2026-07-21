<template>
  <barcode-scanner @success="onScanSuccess" @error="onScanError" />
</template>

<script setup>
const router = useRouter();
const { t } = useI18n();

// 扫描成功处理
const onScanSuccess = ({ text }) => {

  console.log('text', text)

  try {
    const url = new URL(text);
    // 检查是否是后台地址
    if (url.origin === import.meta.env.VITE_BACKGROUND_URL) {
      // 直接打开后台地址
      window.location.href = url;
      return;
    }

    console.log('url', url)

  } catch (e) {

    console.log('e', e)

    router.replace({
      path: '/scan-result',
      query: { result: text }
    })
  }

  // // 跳转到结果页
  // router.push({
  //   path: '/scan-result',
  //   query: { result }
  // })
};

// 扫描失败处理
const onScanError = (error) => {
  console.error("Scan error:", error);
  showToast(t("routes.scan.scanFailed"));
};
</script>

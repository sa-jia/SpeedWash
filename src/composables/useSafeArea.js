export function useAppSafeArea() {
  const safeAreaBottom = ref(0)
  const safeAreaTop = ref(0)

  onMounted(() => {
    // 获取安全区域高度
    const computeSafeArea = () => {
      // 获取底部安全区域
      const bottom = getComputedStyle(document.documentElement)
        .getPropertyValue('--van-safe-area-inset-bottom')
        .match(/\d+/)?.[0] || 0
      
      // 获取顶部安全区域
      const top = getComputedStyle(document.documentElement)
        .getPropertyValue('--van-safe-area-inset-top')
        .match(/\d+/)?.[0] || 0

      safeAreaBottom.value = parseInt(bottom)
      safeAreaTop.value = parseInt(top)
    }

    // 初始计算
    computeSafeArea()

    // 监听屏幕旋转
    window.addEventListener('orientationchange', computeSafeArea)

    // 清理
    onUnmounted(() => {
      window.removeEventListener('orientationchange', computeSafeArea)
    })
  })

  return {
    safeAreaBottom,
    safeAreaTop,
    // 计算属性: 底部安全区域 + Tabbar 高度
    tabbarHeight: computed(() => {
      const tabbarBaseHeight = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--van-tabbar-height') || '50'
      )
      return tabbarBaseHeight + safeAreaBottom.value
    })
  }
} 
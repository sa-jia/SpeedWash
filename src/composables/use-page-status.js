export function usePageStatus() {
  const isLoading = ref(false);
  const error = ref(null);

  // 设置加载状态
  const setLoading = (status) => {
    isLoading.value = status;
  };

  // 设置错误信息
  const setError = (err) => {
    error.value = err;
  };

  // 清除状态
  const clearStatus = () => {
    isLoading.value = false;
    error.value = null;
  };

  // 用于监听异步操作的错误
  const watchError = (errorRef) => {
    watch(errorRef, (err) => {
      if (err) {
        error.value = err;
      }
    });
  };

  // 用于监听异步操作的加载状态
  const watchLoading = (loadingRef) => {
    watch(loadingRef, (loading) => {
      isLoading.value = loading;
    });
  };

  return {
    isLoading,
    error,
    setLoading,
    setError,
    clearStatus,
    watchError,
    watchLoading
  };
} 
import { isZh as isZhFn } from "@/utils";

export function useLocale() {
  const isZh = computed(() => isZhFn());
  return { isZh };
}

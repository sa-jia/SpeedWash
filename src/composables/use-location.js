import { useI18n } from "vue-i18n";
import { calculateDistance } from "@/utils";

export function useLocation(data) {
  const { t } = useI18n();

  function formatDistance(distance) {
    if (distance === null || distance === undefined || isNaN(distance)) return t('distance.calculating');
    if (distance < 1) {
      return t('distance.meters', { value: (distance * 1000).toFixed(0) });
    } else if (distance < 10) {
      return t('distance.kilometers', { value: distance.toFixed(2) });
    } else {
      return t('distance.kilometers', { value: distance.toFixed(1) });
    }
  }

  const distance = computed(() =>
    calculateDistance(toValue(data).lat1, toValue(data).lon1, toValue(data).lat2, toValue(data).lon2)
  );
  const distanceFormatted = computed(() => formatDistance(distance.value));
  return {
    distance,
    distanceFormatted,
  };
}

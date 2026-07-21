import { vipCardApi } from "@/api";

// ═══════════════════════════════════════════════════════════════════════════
// Detección de "socio fundador" — gate frontend + backend abierto (Camino B1).
//
// Los packs "Pack Fundador X4/X8" son un beneficio exclusivo para los primeros
// clientes de Speed Wash Funes. Tienen precio preferencial (40% off vs precio
// de lista). El plan operativo:
//
//   - Hasta 31-oct-2026 los fundadores pueden seguir comprando esos packs.
//   - Después del 31-oct nace un nuevo beneficio de 30% off (pack nuevo — otra
//     iteración de este mismo composable en su momento).
//
// Cómo detectamos que un usuario es fundador:
//
//   Su `vipCardApi.myCardList()` tiene AL MENOS UN pack cuyo `cardName`
//   matchea /^pack\s+fundador/i. Puede estar activo, usado o expirado —
//   cualquiera vale (es huella permanente de haber sido parte del batch).
//
// Por qué gate en el frontend en vez de en el backend:
//
//   El backend chino no soporta "packs solo visibles para usuarios que ya
//   tienen X". La única forma era "grounding" (invisible para todos).
//   Test empírico confirmado (2026-07-18): sacando el pack del grounding,
//   `newVipCardOrder(cardId)` responde SUCCESS y crea la orden real en MP —
//   grounding es SOLO gate UI del panel de admin, NO del endpoint público.
//   Ver memoria "pack-fundador-flujo".
//
// Riesgo del gate frontend: usuario avispado podría inspeccionar la respuesta
// de canBuyList (que sí contiene el pack) y llamar a newVipCardOrder desde
// consola. Aceptable: 100% de la base usa móvil (no F12), la pérdida potencial
// es marginal (1-2 packs a $60k), y la UX ganada vs. mandarlos a WhatsApp
// manual es enorme (fundador compra en 2 taps sin fricción).
// ═══════════════════════════════════════════════════════════════════════════

// Regex del cardName que identifica un pack Fundador. Matchea "Pack Fundador
// X4", "Pack Fundador X8", y cualquier variante futura ("Pack Fundador X12").
const FOUNDER_CARDNAME_REGEX = /^pack\s+fundador/i;

// Fin de la promo de fundador. Después de esta fecha (medianoche AR) la
// detección se apaga automáticamente y los fundadores pasan a ver los packs
// normales. NO requiere deploy — es un check contra `new Date()`. Si cambia
// la fecha o se extiende la promo, editar esta constante.
const FOUNDER_PROMO_END = new Date("2026-10-31T23:59:59-03:00");

export function isFounderCard(card) {
  return FOUNDER_CARDNAME_REGEX.test(card?.cardName || "");
}

export function useFounderStatus() {
  // Solo tiene sentido para usuarios registrados. Guests no tienen packs.
  const { isRegistered, getToken } = useUserStore();

  // canUseType: 1 = activos, 2 = usados, 3 = expirados.
  // Chequeamos TODOS los estados (con Promise.all) porque un usuario que ya
  // usó todo su pack Fundador X4 sigue siendo fundador — que se le dio el
  // beneficio una vez es suficiente huella.
  const hasFounderCard = ref(false);
  const isLoading = ref(true);

  // Sin token real → no llamamos (rebotaría a /login con code 999).
  if (!isRegistered || !getToken()) {
    isLoading.value = false;
    return {
      isFounder: computed(() => false),
      isLoading,
      isPromoActive: computed(() => false),
    };
  }

  // Traemos los 3 estados en paralelo para no perder detecciones.
  const loadAllCards = async () => {
    try {
      const results = await Promise.all([
        vipCardApi.myCardList({ canUseType: 1 }),
        vipCardApi.myCardList({ canUseType: 2 }),
        vipCardApi.myCardList({ canUseType: 3 }),
      ]);
      const all = results.flatMap(({ data }) => {
        const list = unref(data);
        return Array.isArray(list) ? list : [];
      });
      hasFounderCard.value = all.some(isFounderCard);
    } catch {
      // Falla silenciosa: si la request explota, asumimos no-fundador. El
      // gate visual se cae al lado seguro (no exponer beneficio de más).
      hasFounderCard.value = false;
    } finally {
      isLoading.value = false;
    }
  };
  loadAllCards();

  // La promo sigue activa mientras estemos antes del FOUNDER_PROMO_END.
  // Se evalúa al momento de la consulta (no queda cacheado el resultado).
  const isPromoActive = computed(() => new Date() <= FOUNDER_PROMO_END);

  // Es fundador SOLO si (a) tiene la huella de fundador Y (b) la promo sigue.
  // Después del 31-oct la detección se apaga aunque tenga la huella.
  const isFounder = computed(() => hasFounderCard.value && isPromoActive.value);

  return {
    isFounder,
    isLoading,
    isPromoActive,
  };
}

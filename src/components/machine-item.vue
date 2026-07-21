<script setup>
import { IOT_STATUS } from "@/constants";

const props = defineProps({
  machine: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();
const router = useRouter();

// Heurística simple para el ícono según el tipo de lavado
const isTouchless = computed(() =>
  /sin\s*contacto|touchless/i.test(props.machine?.name || "")
);

// Segunda línea del botón: "de Rodillos" / "Sin Contacto"
const chooseType = computed(() => {
  const name = props.machine?.name || "";
  const base = name.replace(/^\s*lavado\s*/i, "").trim();
  if (!base) return "";
  // Una sola palabra ("Rodillos") -> "de Rodillos"; varias ("Sin Contacto") se deja igual
  return /\s/.test(base) ? base : `de ${base}`;
});

// Estado real de la máquina (viene en storeApi.detail → iotList[].iotStatus).
// Mostrarlo ACÁ (antes de que el usuario entre) le ahorra tener que abrir
// cada máquina para ver si está libre. Especialmente útil parado en el
// lavadero con las dos máquinas a la vista.
const statusKey = computed(() => {
  const s = Number(props.machine?.iotStatus);
  if (s === IOT_STATUS.AVAILABLE) return "available";
  if (s === IOT_STATUS.IN_USE) return "inUse";
  if (s === IOT_STATUS.MAINTENANCE) return "maintenance";
  return null;
});
const statusLabel = computed(() =>
  statusKey.value ? t(`components.machineItem.status.${statusKey.value}`) : ""
);

const handleGoWash = () => {
  router.push(`/washer/${props.machine.iotId}`);
};
</script>

<template>
  <div
    class="machine-card clickable"
    :class="[`machine-card--${statusKey || 'unknown'}`]"
    @click="handleGoWash"
  >
    <!-- glow decorativo -->
    <div class="machine-card__glow"></div>

    <!-- Badge de estado (esquina superior izquierda). Le dice al usuario si
         la máquina está libre / en uso / en mantenimiento ANTES de entrar. -->
    <div v-if="statusKey" class="mstatus" :class="`mstatus--${statusKey}`">
      <span class="mstatus__dot"></span>
      {{ statusLabel }}
    </div>

    <!-- Ilustración -->
    <div class="machine-card__art">
      <!-- Sin contacto: gotas de agua -->
      <template v-if="isTouchless">
        <span class="drop drop--1"></span>
        <span class="drop drop--2"></span>
        <span class="drop drop--3"></span>
      </template>
      <!-- Rodillos: cepillos que barren el auto -->
      <template v-else>
        <span class="brush brush--1"></span>
        <span class="brush brush--2"></span>
      </template>
      <!-- auto -->
      <svg class="machine-card__car" viewBox="0 0 48 48" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 28l2.6-8.2A4 4 0 0 1 14.4 17h19.2a4 4 0 0 1 3.8 2.8L40 28" />
        <path d="M5 28h38v7a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2H13v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
        <circle cx="14" cy="32.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="34" cy="32.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
      <!-- icono modo -->
      <div class="machine-card__badge">
        <van-icon :name="isTouchless ? 'closed-eye' : 'replay'" />
      </div>
    </div>

    <!-- Nombre -->
    <div class="machine-card__name">{{ machine.name }}</div>
    <div class="machine-card__sub" v-if="machine.address">{{ machine.address }}</div>

    <!-- CTA — texto cambia según estado real. La pantalla que renderiza esta
         card (store/index.vue) NO muestra machine-item hasta que todas las
         iotInfo() resolvieron, así que statusKey ya viene con el valor real
         cuando esto se pinta. -->
    <van-button
      round
      size="small"
      block
      class="machine-card__btn"
      :type="statusKey === 'available' ? 'primary' : 'default'"
    >
      {{ t(`components.machineItem.actions.${statusKey === 'available' ? 'wash' : statusKey === 'inUse' ? 'seeInUse' : statusKey === 'maintenance' ? 'seeMaintenance' : 'moreInfo'}`) }}
    </van-button>
  </div>
</template>

<style scoped>
.machine-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 12px 12px;
  border-radius: 18px;
  background: var(--surface-color);
  border: 1px solid var(--line-color);
  box-shadow: 0 10px 28px -18px rgba(0, 0, 0, 0.85);
  overflow: hidden;
  /* isolation → contiene el badge absoluto adentro (mismo fix que shop-card) */
  isolation: isolate;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.machine-card:active {
  transform: scale(0.99);
}

/* Tinte del borde/sombra según estado — refuerza la señal del badge sin
   necesidad de leerlo. Disponible = celeste vivo (invita a apretar);
   En uso = neutro atenuado; Mantenimiento = rojo suave (advertencia). */
.machine-card--available {
  border-color: rgba(0, 187, 252, 0.55);
  box-shadow:
    0 10px 28px -18px rgba(0, 0, 0, 0.85),
    0 0 0 1px rgba(0, 187, 252, 0.15) inset;
}

.machine-card--inUse {
  opacity: 0.92;
}

.machine-card--maintenance {
  border-color: rgba(240, 68, 56, 0.35);
  opacity: 0.85;
}

.machine-card__glow {
  position: absolute;
  top: -40px;
  right: -30px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 187, 252, 0.22) 0%, transparent 70%);
  pointer-events: none;
}

/* Badge de estado de la máquina — píldora chica arriba a la izquierda.
   Diseño espejo del status-badge del sitio y del detalle de sucursal para
   coherencia visual en toda la app. */
.mstatus {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px 3px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.mstatus__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mstatus--available {
  color: var(--brand-success);
  background: rgba(var(--brand-success-rgb), 0.16);
  border: 1px solid rgba(var(--brand-success-rgb), 0.4);
}

.mstatus--available .mstatus__dot {
  background: var(--brand-success);
  animation: mstatus-pulse 2s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(var(--brand-success-rgb), 0.7);
}

.mstatus--inUse {
  color: #FFB84D;
  background: rgba(255, 184, 77, 0.14);
  border: 1px solid rgba(255, 184, 77, 0.4);
}

.mstatus--inUse .mstatus__dot {
  background: #FFB84D;
}

.mstatus--maintenance {
  color: #FF6B60;
  background: rgba(240, 68, 56, 0.14);
  border: 1px solid rgba(240, 68, 56, 0.42);
}

.mstatus--maintenance .mstatus__dot {
  background: #FF6B60;
}

@keyframes mstatus-pulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--brand-success-rgb), 0.55), 0 0 6px rgba(var(--brand-success-rgb), 0.7); }
  70% { box-shadow: 0 0 0 5px rgba(var(--brand-success-rgb), 0), 0 0 6px rgba(var(--brand-success-rgb), 0.7); }
  100% { box-shadow: 0 0 0 0 rgba(var(--brand-success-rgb), 0), 0 0 6px rgba(var(--brand-success-rgb), 0.7); }
}

/* Ilustración */
.machine-card__art {
  position: relative;
  height: 78px;
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(0, 187, 252, 0.08) 0%, rgba(0, 187, 252, 0) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.machine-card__car {
  width: 64px;
  height: 64px;
  color: var(--primary-color);
  filter: drop-shadow(0 0 12px rgba(0, 187, 252, 0.45));
}

.machine-card__badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #fff;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  box-shadow: 0 4px 10px -4px rgba(0, 187, 252, 0.7);
}

/* gotas animadas */
.drop {
  position: absolute;
  top: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50% 50% 50% 0;
  background: var(--primary-light);
  transform: rotate(45deg);
  opacity: 0.85;
  animation: drip 2.4s ease-in-out infinite;
}
.drop--1 { left: 30%; animation-delay: 0s; }
.drop--2 { left: 50%; animation-delay: 0.5s; }
.drop--3 { left: 68%; animation-delay: 1s; }

@keyframes drip {
  0% { transform: translateY(0) rotate(45deg); opacity: 0; }
  30% { opacity: 0.85; }
  100% { transform: translateY(14px) rotate(45deg); opacity: 0; }
}

/* cepillos / rodillos que barren el auto */
.brush {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 50%;
  margin-left: -5.5px;
  width: 11px;
  border-radius: 6px;
  z-index: 2;
  background: repeating-linear-gradient(
    to bottom,
    var(--primary-light) 0,
    var(--primary-light) 2px,
    rgba(0, 187, 252, 0.12) 2px,
    rgba(0, 187, 252, 0.12) 5px
  );
  filter: drop-shadow(0 0 6px rgba(0, 187, 252, 0.55));
  opacity: 0.9;
}
.brush--1 { animation: sweep-a 2.6s ease-in-out infinite; }
.brush--2 { animation: sweep-b 2.6s ease-in-out infinite; }

@keyframes sweep-a {
  0%, 100% { transform: translateX(-26px) scaleX(1); }
  50% { transform: translateX(26px) scaleX(0.7); }
}
@keyframes sweep-b {
  0%, 100% { transform: translateX(26px) scaleX(1); }
  50% { transform: translateX(-26px) scaleX(0.7); }
}

.machine-card__name {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.2;
  text-align: center;
}

.machine-card__sub {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.3;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.machine-card__btn {
  margin-top: 8px;
  font-weight: 700;
  font-size: 13.5px;
  height: auto;
  min-height: 34px;
  padding: 7px 10px;
}

.machine-card__btn :deep(.van-button__text) {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.machine-card__btn-line {
  display: block;
}

@media (prefers-reduced-motion: reduce) {
  .drop { animation: none; opacity: 0; }
  .brush { animation: none; }
  .mstatus--available .mstatus__dot { animation: none; }
}
</style>

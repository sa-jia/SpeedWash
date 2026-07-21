import { setToastDefaultOptions } from "vant";

// Los toasts son el único feedback de errores de la app (mensajes del
// backend traducidos en useApi). El default de Vant (2000ms) queda corto
// para leer frases completas tipo "Este número ya tiene una cuenta.
// Iniciá sesión." — lo subimos para que dé tiempo a leer y reaccionar.
export const install = () => {
  setToastDefaultOptions({ duration: 3500 });
};

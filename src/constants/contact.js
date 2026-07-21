// Contactos de Speed Wash — hardcodeados a propósito.
// El modelo operativo hasta la apertura es manual: reembolsos y consultas se
// resuelven por WhatsApp con el encargado, no vía panel del backend. Emergencias
// físicas (usuario encerrado, algo roto en sitio) se resuelven llamando.
// Si cambia un número, editar esta lista y hacer deploy.

// WhatsApp de atención al cliente (bot del proyecto Mejor Hablemos).
// E.164 CON el "9" y sin "+", como pide wa.me/<number>. NO tocar el formato:
// WhatsApp exige el 9 para móviles argentinos aunque para llamadas de voz
// entre celulares argentinos ese 9 sea contraproducente (ver EMERGENCY_CONTACTS).
export const WHATSAPP_CONTACT = "5493412523013";

// Contactos para llamada de emergencia durante un lavado en curso.
// `phone` va a un `tel:` → SIN el "9" argentino y sin `+54`, porque algunas
// operadoras locales fallan al marcar entre móviles cuando aparece el "9"
// en formato internacional. Con solo el código de área + número la llamada
// local sale bien (y desde el exterior el celular igual la resuelve).
// `display` es lo que se muestra en el action-sheet, en formato AR legible.
// Orden: primero el que atiende antes en sucursal (SpeedWash — es el nº del
// bot que responde el encargado), después socios locales, Matías al final
// porque su nº es CABA (11) — más lejos para una emergencia física en Funes.
export const EMERGENCY_CONTACTS = [
  { name: "SpeedWash", phone: "3412523013", display: "341 252 3013" },
  { name: "Germán",    phone: "3416565565", display: "341 656 5565" },
  { name: "Federico",  phone: "3413312197", display: "341 331 2197" },
  { name: "Matías",    phone: "1157546672", display: "11 5754 6672" },
];

// Arma la URL de wa.me con un mensaje pre-armado (opcional).
export function whatsappUrl(text) {
  const base = `https://wa.me/${WHATSAPP_CONTACT}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

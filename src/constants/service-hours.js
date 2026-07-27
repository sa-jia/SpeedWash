// Horarios de servicio de la sucursal — hardcodeados a propósito.
// El backend solo devuelve `opening` (abierto sí/no); no expone horarios ni
// distingue tipos de servicio. Si cambia un horario, editar acá y hacer deploy.
//
// La distinción que importa, y por la que esto son DOS líneas y no una:
// las máquinas son autoservicio y funcionan las 24 hs, mientras que el
// personal (secado y limpieza interior) tiene horario acotado. Publicar un
// único "horario de la sucursal" con el del personal haría creer que el
// lavadero cierra a las 16 — y se perderían los lavados de noche y domingo,
// que son justamente la ventaja del formato automático.

// Horario del personal en sucursal. `days` se traduce; las horas van acá
// porque son iguales en los tres idiomas.
export const STAFF_HOURS = {
  weekdays: "8 a 16 h",
  saturday: "9 a 17 h",
};

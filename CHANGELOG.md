# Changelog — Speed Wash app (lavar.speedwash.com.ar)

Este changelog documenta cambios aplicados al frontend de la PWA Vue (carpeta
`src/`) **y** las acciones pendientes que requieren intervención del backend
(mantenido por el proveedor en China). El sitio institucional Next.js
(carpeta `web/`) no está incluido — se versiona por separado.

Branch: `fix/app-lavar-cleanup`
Fecha: 2026-06-09

---

## 📋 Mis pedidos — contadores, nombres claros y reclamo por WhatsApp (2026-07-23)

### Qué significaba cada estado (auditoría)

Disparado por una pregunta razonable: *"¿qué es En curso y qué es Pendientes?"*.
Resultó que **hay tres enums de "estado" distintos, y dos usan los mismos
números para cosas diferentes**:

**A — `state`: el filtro de la pestaña** (lo que se le manda a la API)
`1` todos · `2` en curso · `3` **esperando pago** · `4` completados

**B — `showState`: el estado de cada pedido** (lo que devuelve el backend)
`1` pendiente de pago · `2` pago vencido · `3` timeout de arranque ·
`4` **lavando** · `5` completado

**C — `washStatus`: el ciclo de lavado** (solo en el detalle)
`1` no iniciado · `2` lavando · `3` finalizado · `4` timeout de arranque

Ojo con la colisión: **`4` como filtro es "Completados", pero `4` como estado
de pedido es "Lavando"**. Son enums independientes que comparten numeración —
viene así del white-label original.

La confusión de fondo: leídas juntas, "En curso" y "Pendientes" parecían dos
etapas del lavado, cuando **"Pendientes" era de la plata, no del lavado**.

### Cambios

- **"Pendientes"/"Pendiente" → "A pagar"** en los tres lugares donde aparecía
  (pestaña, acceso directo de Mi cuenta, y el estado del detalle). En inglés
  "To pay". El chino ya decía 待付款 ("esperando pago") — siempre estuvo bien,
  se perdió en la traducción al español. — [es-AR.json](locales/es-AR.json),
  [en.json](locales/en.json)
- **Contadores por pestaña** (`Todos (10)`, `A pagar (0)`, …) y **globito** en
  los tres accesos directos de Mi cuenta. El backend no tiene endpoint de
  conteo: pedimos una página de `pageSize: 1` por filtro y usamos el `total`.
  La pestaña activa se mantiene al día gratis con el `total` que ya trae la
  lista. — [useOrder.js](src/composables/useOrder.js),
  [order/index.vue](src/pages/order/index.vue), [mine-page.vue](src/pages/mine-page.vue)
  - En las pestañas el `(0)` se muestra (es información: no debés nada); en los
    globitos no (un 0 flotando sobre un icono es ruido).
  - Si la llamada falla **no se muestra número**, nunca un `0` por las dudas:
    un "A pagar (0)" falso haría creer que no hay plata pendiente.
  - En Mi cuenta el conteo **solo se pide con cuenta real**. Un invitado no
    tiene token y `washOrderPage` le devolvería `999`, que en una página
    protegida lo patea a `/login` (ver [useApi.js](src/composables/useApi.js)) —
    o sea que abrir Mi cuenta lo habría expulsado. Mismo criterio que `myInfo`.
- **Los dos estados de falla ahora se distinguen** — antes los dos se pintaban
  del mismo azul que un pedido normal, porque `getStatusStyle` no tenía entrada
  para ninguno: pasaban desapercibidos. — [order-item.vue](src/components/order/order-item.vue)
  - **Pago vencido** (`showState 2`): **gris**. No se cobró nada, no hay nada
    que reclamar — es un pedido muerto.
  - **Timeout de arranque** (`showState 3`): **rojo**, y el botón de WhatsApp
    pasa a decir **"Reclamar"**. Es plata cobrada sin servicio.
- **Mensaje de reclamo propio**: *"Hola, necesito hacer un reclamo: pagué este
  lavado y la máquina nunca arrancó"* + los datos del pedido, en vez del
  genérico *"tengo una consulta sobre este pedido"*. En la lista y en el
  detalle, en los tres idiomas. — [order/detail.vue](src/pages/order/detail.vue)
  - En el detalle se chequean **los dos campos** (`showState === 3` o
    `washStatus === 4`): describen el mismo evento, pero no está confirmado que
    `washOrderInfo` devuelva `showState` (su `getOrderStatus` está definido y
    no se usa en ningún lado). `washStatus` sí lo usa la página con certeza.
- **No se agregó pestaña de reclamos**: el filtro `state` de la API no tiene
  valor para los estados de falla. Filtrar del lado del cliente rompería la
  paginación y el contador (ver pendiente **2.11**). El caso real es que se
  reclama al toque, y recién ocurrido ese pedido está arriba de todo en "Todos".
- Limpieza: se sacaron tres imports de PNG muertos en `mine-page.vue`.

---

## 🐛 El escáner se colgaba después de leer el QR (2026-07-23)

**Síntoma reportado:** al escanear el QR de una máquina la cámara leía bien
(se congelaba el último cuadro y aparecía el punto azul que marca el código
detectado), pero **la app se quedaba ahí para siempre**. Pasaba igual con el
QR viejo (`/washer/1`) y con el nuevo (`/washer/3`).

**Causa:** en `onScanSuccess` la navegación estaba **dentro del `catch`** del
`new URL(text)`. O sea que el único caso que navegaba era que el contenido
del QR **no** fuera una URL válida. Como el QR de la máquina sí es una URL, el
parseo nunca fallaba: se comparaba contra `VITE_BACKGROUND_URL` (que además no
está definida), no matcheaba, se hacía un `console.log` y la función terminaba
sin hacer nada. La lectura del QR nunca estuvo rota — el problema era qué se
hacía con el texto leído.

**Arreglo** — [scan-page.vue](src/pages/scan-page.vue): ahora todos los casos
tienen salida.

| QR contiene | Acción |
|---|---|
| URL nuestra (`/washer/:id`, `/store/:id`, `/invite/:code`) | navega dentro de la app |
| URL de otro host de `speedwash.com.ar` | carga la URL (deja que el server redirija) |
| URL de un tercero | pantalla de resultado con aviso de seguridad |
| texto plano (`3`, `machine3`, `washer-3`) | navega a `/washer/<n>` |
| cualquier otra cosa | pantalla de resultado |

Dos detalles:

- Se navega **con el router de Vue**, no con `window.location`: el mapeo de QR
  viejos (`1→3`, `2→4`) vive en el `beforeEnter` de `/washer/:id`
  ([router/index.js](src/router/index.js)), así que tiene que pasar por el
  router para seguir aplicando.
- Antes de navegar se valida con `router.resolve()` que la ruta **exista**. No
  hay ruta catch-all en el proyecto: un `replace()` a un path sin match no
  renderiza nada y dejaría la pantalla colgada igual que el bug original.

El QR se matchea también por path aunque el host no sea el actual, por si
quedó alguno impreso con otro dominio.

---

## 🚨 Caída del envío de SMS — pasarela del proveedor (2026-07-06)

Desde ~2026-07-05 el envío de códigos por SMS **falla para todos los números
argentinos**, bloqueando **registro de nuevos usuarios Y recuperación de
contraseña** (60+ usuarios afectados). Venía andando normal el día anterior.

**Diagnóstico (verificado, es 100% del backend):**

- `curl` directo al backend (sin frontend de por medio):
  `POST /api/user/sms/resetPwd` y `/regedit` → **HTTP 200** con cuerpo
  `{"code":1,"msg":"SMS send fail"}`, en ~1s. Reproducido con número real y
  válido (`543413312197`, formato `54`+10 díg. — el mismo que funcionó hasta ayer).
- **No es formato del teléfono**: los 60 usuarios se registraron con ese mismo
  formato; el "9" de móvil argentino no es la causa (y cambiarlo rompería el
  login de los 60 existentes → descartado).
- **No es el frontend**: `git log --since="8 days ago"` está vacío; último commit
  2026-06-16 (~3 semanas antes). El error es un JSON aplicativo bien formado
  `{code,msg}` del backend correcto (`argentina-user.cheyoudaren.com`) — un
  misruteo daría 404/405/HTML/CORS, no esto. El POST llega bien; falla la
  pasarela de SMS del proveedor.
- **No es ruteo/proxy**: `smsApi` usa el mismo `createApi`/`baseUrl "/api"`/proxy
  que `storeList` (que funciona). Si fuera ruteo, `storeList` también caería.

**⏳ Acción del proveedor (backend) — URGENTE:**

- Revisar la pasarela de SMS: **saldo/crédito** (causa más probable),
  **API key/credenciales** (vencidas o rotadas), **routing/allowlist para
  Argentina (+54)**, y los **logs del proveedor** con el motivo exacto del fallo.
- Endpoints: `POST /api/user/sms/resetPwd`, `POST /api/user/sms/regedit`
  (`argentina-user.cheyoudaren.com`).

**Mitigación aplicada en el frontend (cosmética, no levanta el bloqueo):**

- Mapeo del `msg` "SMS send fail" a un mensaje claro (*"No pudimos enviarte el
  SMS. Revisá que el número sea correcto o probá de nuevo en unos minutos."*) en
  lugar del genérico "Algo no salió bien". — [backendErrors.js](src/utils/backendErrors.js),
  [es-AR.json](locales/es-AR.json), [en.json](locales/en.json)
- Log del `msg` crudo del backend en consola para diagnosticar desde el campo.

---

## 🎨 Ronda UX — packs, máquina, mi cuenta y rename del lavado (2026-06-16)

Lote de ajustes de copy, naming y conversión. **Casi todo es frontend; hay
una sola acción pendiente del proveedor (ver abajo).**

**Frontend (no requiere backend):**

- **Home › tagline**: "Sin turnos. Sin esperas. En minutos." → **"Sin turnos.
  Llegás y listo. En minutos."** — [es-AR.json](locales/es-AR.json) `routes.home.hero.tagline`
- **Home › microbanner**: "Lavado desde $23.000 · 24/7" → **"Lavado con Cera ·
  $25.000 · 24/7"** (sin "SpeedWash" — el logo ya lo dice; así entra en un
  renglón) — `routes.home.hero.microbanner`
- **Home › packs subtítulo**: "Lavados prepagos: ahorrá en cada visita." →
  **"Comprá lavados prepagos y ahorrá."** — `routes.home.vip.subtitle`
- **Home › packs CTA**: "Ver planes" → **"Ver packs"** — `routes.home.vip.buy`
- **Rename del lavado premium**: "Lavado Premium" → **"Lavado SpeedWash con
  Cera"** en toda la app. El nombre lo manda el vendor en `schemeList[].name`,
  así que se hace un override de display en frontend (no se toca el dato del
  vendor): helper `displayPlanName` que matchea `/premium/i` →
  [washer/index.vue](src/pages/washer/index.vue), nuevo key
  `routes.washer.planName.premium`, y `washMode.2/3` actualizados (los usa
  `membership-card`). Aplicado en es-AR, en y zh-CN.
- **Pantalla máquina**: el "Lavado SpeedWash con Cera" (premium) queda
  **preseleccionado al cargar** (si no hay, cae al de mayor precio), así el
  botón "Iniciar lavado" funciona sin un tap previo de selección. El guard de
  disponibilidad de la máquina (`canWash`) se mantiene. — [washer/index.vue](src/pages/washer/index.vue)
- **Mi cuenta**: botón **"Cerrar sesión"** al final del scroll, mismo flujo que
  Configuración (diálogo de confirmación + `userStore.logout()`). —
  [mine-page.vue](src/pages/mine-page.vue)
- **Comprar tarjeta VIP**: tocar un pack **ejecuta la compra directamente**,
  sin el paso intermedio del botón "Comprar". Se eliminó la action bar; overlay
  de carga mientras se inicia el checkout. — [membership/index.vue](src/pages/membership/index.vue)
- **Home › packs › patente**: "…sin escanear, sin esperar." → **"…sin escanear,
  llegás y arranca."** — `routes.home.vip.plateSub`
- **Mi cuenta como invitado**: en vez del perfil vacío + "Cerrar sesión" (que no
  tiene sentido sin cuenta), se muestra un estado **"Creá tu cuenta SpeedWash"**
  con CTA Crear cuenta / Ya tengo cuenta. No se llama `myInfo()` para invitados.
  — [mine-page.vue](src/pages/mine-page.vue)
- **Flujo invitado → compra**: el guard redirige al invitado (sin token) que
  toca packs/abonos/billetera a **login con el mensaje "necesitás cuenta"**, en
  vez de dejar que el backend tire 999 → "tu sesión expiró" (confuso, nunca tuvo
  sesión). — [router.js](src/modules/router.js) `requiresAccountPages`
- **Selector de tarjeta VIP**: flujo confuso ("No usar tarjeta" era el único
  botón). Ahora tocar resalta, **"Usar esta tarjeta"** (primario) confirma y
  **"Pagar sin tarjeta"** (secundario) cancela. — [vip-card-selector.vue](src/components/vip-card-selector.vue)
- **Mi abono (vouchers)**: botones "Vincular patente" / "Usar ahora" pasan a
  **fila full-width** abajo de la tarjeta. La patente vinculada se muestra como
  **chip** claro (o "Sin patente vinculada"); el botón es **"Cambiar patente"**
  si ya hay una, y el popup **precarga** la patente para editarla. —
  [voucher-card.vue](src/components/voucher-card.vue), [voucher/index.vue](src/pages/voucher/index.vue)
- **Vincular patente**: botones ya no se desbordan; se eliminó "Restablecer"
  (emitía patente vacía mostrando "éxito" — bug). **Validación de patente
  argentina** (AB123CD Mercosur / A123BC moto / ABC123 vieja) con sanitización
  en vivo. — [bind-license-plate.vue](src/components/bind-license-plate.vue)
- **Login**: "Crear cuenta nueva" pasa de text-link a **botón CTA outline** bajo
  "Ingresar" (temporal, mientras la base aún no tiene cuenta). — [login-page.vue](src/pages/login-page.vue)
- **Escáner**: botón para **cambiar cámara** (solo si hay +1) y se prioriza
  `facingMode: environment` para abrir la trasera por defecto (en algunos
  Android abría la frontal). — [barcode-scanner.vue](src/components/barcode-scanner.vue)
- **Detalle de sucursal**: nuevo render de portada; se recortó la franja blanca
  inferior del PNG (646×362 → 646×340) y se ajustó el contenedor full-width sin
  espacio muerto. — [store/index.vue](src/pages/store/index.vue), `store-banner-default.png`
- **Plan de lavado**: se quitó la descripción "Plus + capa de cera"; cuando la
  máquina tiene un solo lavado, la tarjeta ocupa **todo el ancho**. — [washer/index.vue](src/pages/washer/index.vue)
- **Toast con ícono**: el cuadrado fijo partía palabras ("vinc/ulada"); ahora
  crece a lo ancho y el texto va en una línea. — [main.css](src/styles/main.css)

**⏳ Acción del proveedor (backend):**

- **Título "Buy VIP" en la pantalla de pago del pack.** En el checkout de
  Mercado Pago el ítem aparece como **"Buy VIP"** (en inglés y genérico). El
  frontend solo envía `POST /vipCard/newVipCardOrder/{cardId}` — el `title` de
  la preferencia MP lo arma el backend del proveedor, **no es editable desde la
  app**. Pedido: que el `title`/`subject` de la preferencia use el **nombre del
  pack seleccionado** (ej. "Pack Speed 4 Lavados") en español. Endpoint:
  `newVipCardOrder/{cardId}` (`argentina-user.cheyoudaren.com`).

---

## 🔧 Fix crítico — producción sin API por build sin `.env` (2026-06-12)

El build de jun-2026 subido a producción se hizo **sin `.env`**, dejando
`baseUrl: undefined` horneado en el bundle: todos los llamados a la API
morían con 405 contra el propio dominio (textos OK, datos no — login,
usuarios, packs y sucursales rotos). Diagnóstico verificado contra el
bundle deployado y los endpoints en vivo.

Hallazgo clave: el nginx de `lavar.speedwash.com.ar` **ya proxea `/api` →
backend real** (`argentina-user.cheyoudaren.com/api`) — así funcionaban
los builds anteriores (`VITE_API_BASE_URL=/api`).

Fix para que no vuelva a pasar (build correcto aunque falte el `.env`):

- `baseUrl` con default **`"/api"`** si no hay `VITE_API_BASE_URL`.
  — [useApi.js](src/composables/useApi.js)
- Proxy de dev unificado a ese mismo camino: `/api` →
  `argentina-user.cheyoudaren.com` (antes `/api` apuntaba al backend de
  test amaze-ventures y `/user` al real; dev y prod ahora usan la misma
  ruta). — [vite.config.js](vite.config.js)
- Verificado: `pnpm build` sin `.env` hornea `baseUrl:"/api"`, y
  `POST lavar.speedwash.com.ar/api/user/index/storeList` → 200 con datos.

**Acción del proveedor:** solo su deploy de rutina (pull + build + subir
`dist/`), sin recuperar `.env` ni tocar nginx.

---

## 🎨 Ajustes UX — home, login y registro (2026-06-12)

Retoques de legibilidad y navegación. **No requiere backend.**

- **Microbanner de precio/tiempo** ("Lavado desde $23.000 · 8 minutos"):
  era casi imperceptible. Fuente 11px → **15px**, peso 500 → **600**,
  padding 4px 12px → **8px 18px**. Mantiene estilo pill, fondo y colores.
  — [home-page.vue](src/pages/home-page.vue) `.hero-microbanner`
- **Copy del microbanner**: "… · 8 minutos" → **"… · 24/7"**. El "8 minutos"
  duplicaba el tagline "En minutos." de arriba; "24/7" suma info nueva
  (disponibilidad horaria, otro diferenciador clave). — [es-AR.json](locales/es-AR.json)
- **Registro — respiración visual del form de 2 pasos**: la pantalla se
  veía amontonada. Más padding vertical dentro de las cards (cells 10px →
  **14px** + 8px de aire interno en cada card), más separación entre el
  botón "Enviarme código" y el paso 2 (`mt-8` → **`mt-12`**), y headers de
  paso con 14px de margen inferior. — [register-page.vue](src/pages/register-page.vue)
- **Registro — helper del teléfono simplificado**: "Sin 0, sin 15, sin +54.
  Solo 10 dígitos." → **"Solo 10 dígitos. Sin 0 ni 15."** El "+54" ya se ve
  en el selector de país y mencionarlo confundía ("¿lo pongo o no?").
  Actualizado en los 3 idiomas. — [es-AR.json](locales/es-AR.json),
  [en.json](locales/en.json), [zh-CN.json](locales/zh-CN.json)
- **Home — sin "flash" de la sucursal fallback**: al recargar, aparecía un
  instante la card hardcodeada de SpeedWash Funes (sin foto) y luego se
  reemplazaba por la card real de la API. El fallback ahora solo se muestra
  si la request de sucursales terminó sin datos (`isFinished` de useFetch);
  durante la carga no se muestra nada. — [home-page.vue](src/pages/home-page.vue)
- **Toasts más tiempo en pantalla**: los mensajes de error del backend
  (ej. "Este número ya tiene una cuenta. Iniciá sesión.") desaparecían a
  los 2s, sin tiempo de leerlos. Duración default de Vant 2000ms →
  **3500ms**, global vía `setToastDefaultOptions` en un módulo nuevo.
  — [toast.js](src/modules/toast.js)
- **Registro y recuperar contraseña — aclarar que el código llega por SMS**:
  el cliente podía esperar un WhatsApp y creer que falló. Botón del registro
  "Enviarme código" → **"Enviarme código por SMS"**; aviso post-envío
  "Te enviamos un código a {phone}" → **"Te enviamos un SMS a {phone}"**;
  botón de recuperar contraseña "Obtener código" → **"Obtener código por
  SMS"** + nuevo helper bajo el campo de código: *"Te enviamos un SMS al
  número anterior"* (visible tras solicitar el código). Textos en los 3
  idiomas. — [es-AR.json](locales/es-AR.json), [en.json](locales/en.json),
  [zh-CN.json](locales/zh-CN.json), [change-password.vue](src/components/change-password.vue)
- **Login — isotipo más chico**: el logo S central competía con el form
  (80px → **60px** de alto, -25%). — [login-page.vue](src/pages/login-page.vue)
- **Login — "Continuar como invitado" pasa a text link**: era un botón con
  fondo azul que competía con "Ingresar". Ahora es el tercer text link de
  la fila "Crear cuenta nueva | Olvidé mi contraseña | Continuar como
  invitado" (con wrap automático en pantallas angostas). "Ingresar" queda
  como único botón lleno. Se mantiene la lógica de ocultarlo en flujos de
  compra. — [login-page.vue](src/pages/login-page.vue)
- **Login — contenido centrado verticalmente**: la mitad inferior quedaba
  vacía ("pegado arriba"). Logo + form + links se centran ahora en el alto
  disponible bajo el navbar, mismo patrón que recuperar contraseña.
  — [login-page.vue](src/pages/login-page.vue)
- **Recuperar contraseña — card centrada verticalmente**: la card quedaba
  pegada arriba con todo el espacio inferior en negro ("pantalla cortada").
  El contenedor ahora ocupa el alto disponible bajo el navbar y centra la
  card entre el stepper y el bottom (aplica a los 3 pasos del flow, también
  en cambio de contraseña desde ajustes). De paso se eliminó el
  `background: #f7f8fa` gris heredado de KIREI que hubiera quedado visible.
  — [change-password.vue](src/components/change-password.vue)
- **Recuperar contraseña — jerarquía de botones**: "Obtener código" pasó a
  outline (`plain`, borde y texto azul, fondo transparente) para que
  "Siguiente" sea claramente el primario. Cambio local al componente, no
  toca el theme global de Vant. — [change-password.vue](src/components/change-password.vue)
- **Recuperar contraseña — helper del teléfono**: cubierto por el cambio de
  `hintAr` de abajo (usa el mismo `phone-number-field` que registro/login).
- **Flecha "atrás" del login ahora vuelve a la home**: al entrar a una
  página protegida sin sesión (ej. "Mi cuenta"), el guard redirige a
  `/login`; ahí el `back()` rebotaba contra el guard (login → mine → login)
  y la flecha parecía muerta. Nuevo meta de ruta `backTo: "/home"` en Login:
  la flecha hace `router.replace` a la home. — [router/index.js](src/router/index.js),
  [default.vue](src/layouts/default.vue)
- **NavBar de la home sin flecha "atrás"**: la home es la raíz de la
  navegación, la flecha "<" no tenía destino útil y confundía. Nuevo meta de
  ruta `hideBackArrow` (solo en `/home`; el resto de las pantallas conserva
  la flecha). El título "Inicio" queda centrado — Vant centra el título de
  forma absoluta, independiente de los laterales. — [router/index.js](src/router/index.js),
  [default.vue](src/layouts/default.vue)
- **Banner azul de patente** (card "Packs de lavado"): nuevo copy en dos
  líneas con jerarquía — título semibold "Tu patente inicia el lavado." +
  subtítulo sutil "Sin sacar el celular, sin escanear, sin esperar."
  (antes: "Activación automática por patente: no perdés tiempo, tu patente
  inicia el lavado."). Mismo ícono y colores. Key i18n `vip.plate` →
  `vip.plateTitle` + `vip.plateSub`. — [home-page.vue](src/pages/home-page.vue),
  [es-AR.json](locales/es-AR.json)

---

## 📝 Mantenimiento de documentación (2026-06-10)

Sincronización de la documentación con el estado real del código (no toca
código de la app):

- **CLAUDE.md** — UI Framework: paleta actualizada a la real de Speed Wash
  (`primary #00BBFC`, `accent #FF9416`, `success #00D97E`, `error #F04438`;
  antes decía la KIREI `#FD5C57`/`#2ecc71`). i18n: agregado `es-AR.json`
  (español rioplatense, **default del mercado argentino**) junto a en/zh-CN;
  header `lang` ahora `ES`/`EN`/`CN`.
- **CONTEXTO.md** — §12: tokens `--brand-success #00D97E` y `--brand-error
  #F04438` con sus nombres reales de `variables.css`. §13: nota de branding
  unificado en la app (pendiente deploy del chino). §19: "Auditoría visual de
  marca" y páginas legales `/terminos` `/privacidad` movidas a ✅ terminado;
  sumada sub-sección 🟡 Etapa 2 (grises/azules finos + tipografía).

---

## 🎨 Branch `fix/brand-colors` — sistema de color Speed Wash (2026-06-10)

Cierre de la auditoría de marca ([BRAND-AUDIT.md](BRAND-AUDIT.md)). Se
unificó la paleta a tokens, se sumaron `success` y `error`, y se limpiaron
colores hardcodeados heredados del white-label KIREI. **No requiere backend.**

### Decisiones de marca tomadas
- **Verde success oficial:** `#00D97E` (combina con el azul LED, mismo nivel de
  saturación, "verde = ok" universal). Para: abierto/online, verificación/pago
  ok, confirmaciones.
- **Rojo error/danger oficial:** `#F04438` (moderno; se diferencia del spark
  naranja y no se confunde con el viejo Kirei `#FD5C57`).
- **Radius de la app:** se mantiene redondeado (estilo Tesla/Apple Music/
  Spotify). El "borde recto" del manual aplica a piezas estáticas, no a la app.

### Tokens
- `--accent-color` **#FF8C00 → #FF9416** (naranja oficial) + `--accent-light`
  `#FFAB40 → #FFB04D`; idem en `uno.config.js`. — [variables.css](src/styles/variables.css), [uno.config.js](uno.config.js)
- Nuevos `--brand-success` (#00D97E) y `--brand-error` (#F04438) + sus `-rgb`,
  y clases UnoCSS `success` / `error` (`text-success`, `bg-error`, etc.).
- Vant: `--van-success-color` / `--van-tag-success-color` → `--brand-success`.

### Reemplazos de color (hardcoded → token)
- Naranja viejo `#FF8C00`/`#FFAB40` (gradientes/glows) → `#FF9416`/`#FFB04D` en
  8 archivos (home-page, layout, membership-card, voucher-card, order-item,
  mine-page, store, variables).
- Verde Kirei/ad-hoc → `success`: `#2ecc71` ([mine-page.vue:83](src/pages/mine-page.vue#L83),
  [register-page.vue](src/pages/register-page.vue) badge), `#34D399` "Abierto"
  ([shop-list-item.vue](src/components/shop-list-item.vue), [status-tag.vue](src/components/status-tag.vue),
  [home-page.vue](src/pages/home-page.vue), [store/index.vue](src/pages/store/index.vue)),
  `#07c160` "completado" ([order-item.vue](src/components/order/order-item.vue)).
- Rojo error `#E74C3C` → `text-error` ([order-item.vue](src/components/order/order-item.vue),
  [refund/index.vue](src/pages/order/refund/index.vue)).
- Rojo Kirei `#FF6B6B` del checkout Stripe → azul de marca `#00BBFC`
  ([sr-checkout-form.vue:47](src/components/payment/sr-checkout-form.vue#L47)).
- `order-item` status map tokenizado: pending→`text-accent`, processing→`text-primary`.

### Limpieza
- Borrados assets muertos (sin imports) con rojo Kirei: `src/assets/icons/scan.svg`,
  `src/assets/icons/map.svg`, `src/assets/vue.svg`.

### Docs
- `CLAUDE.md`: paleta actualizada (era `#FD5C57`/`#2ecc71` Kirei).
- `CONTEXTO.md §12`: sumados `--success`/`--error` y nota de excepción de radius app↔web.

### Verificación
- `pnpm build` OK (3.1s). Grep confirma 0 restos de los colores migrados.

### ⚠️ Pendiente (Etapa 2, post-lanzamiento) — ver BRAND-AUDIT.md 🟡
- Afinar grises/azules secundarios a valores exactos del manual (surface
  `#141418`→`#17181B`, líneas sólidas→alpha, texto `#ACACB6`→`#C9CDD2`, etc.).
- `letter-spacing` display `-0.02em`→`-0.04em`; eyebrow a Inter 9px.
- Verdes/colores aún fuera de token por ser categóricos, no success: pin de
  mapa `#18C686`, badges de rol `#4CD263`/`#6B7FF7` ([mine/identity.vue](src/pages/mine/identity.vue)),
  amarillo `#FFF1AD` (invite), grises sueltos `#969799`/`#C0C4C8`/`#9FB0CB`.

---

## 1. Cambios aplicados en el frontend (Vue) — no requieren backend

### 1.1 Branding · logo KIREI eliminado de "Crear cuenta"
**Archivo:** `src/pages/register-page.vue` (líneas 92-103 → 92-99)
**Cambio:** se reemplazó el bloque del logo. Antes mostraba
`@/assets/logo_trans.png` dentro de un contenedor cuadrado blanco
(`w-150 aspect-ratio-1 bg-white rounded-lg`) — ese asset es el logo
KIREI Car Wash heredado.

```diff
- <div class="py-10 text-center">
-   <div class="w-150 aspect-ratio-1 mx-auto bg-white rounded-lg flex-center shadow-sm overflow-clip">
-     <img src="@/assets/logo_trans.png" alt="logo" class="w-full aspect-ratio-1" />
-   </div>
- </div>
+ <div class="py-10 text-center">
+   <img src="@/assets/speedwash-logo.png" alt="Speed Wash" class="mx-auto h-80px w-auto" />
+ </div>
```

El asset `src/assets/speedwash-logo.png` ya existía. **Nota:** el asset
`src/assets/logo_trans.png` queda sin referencias en el frontend y puede
eliminarse en una limpieza posterior, junto con `src/assets/logo.jpg`.

### 1.2 Bug: "Continuar como invitado" devolvía a home en loop al comprar pack
**Archivos:** `src/pages/login-page.vue`, `locales/es-AR.json`, `locales/en.json`

El botón ahora se oculta cuando el usuario aterriza en `/login?redirect=...`
viniendo de una ruta que requiere cuenta real (no funciona con `guestId`):
`/vip`, `/vouchers`, `/wallet*`. En su lugar se muestra el mensaje:
> "Para comprar un pack necesitás registrarte. Es gratis y toma 30 segundos."

**Detalle login-page.vue:**
- Líneas 9-17: nueva constante `PURCHASE_PATHS` y computed `isPurchaseFlow`.
- Líneas 102-110: bloque del botón ahora con `v-if="!isPurchaseFlow"` y
  mensaje alternativo (`v-else`).

**Detalle locales:**
- `locales/es-AR.json` línea 76: nueva key
  `routes.login.purchaseRequiresAccount`.
- `locales/en.json` línea 75: misma key en inglés (mantenido como fallback).

### 1.3 Username autogenerado — atajo a editar nombre desde "Mi cuenta"
**Archivo:** `src/pages/mine-page.vue` (líneas 25-28 → 25-31; 145-151 → 145-157)

El backend devuelve `nickName` como un código tipo `b9xN3842` cuando el usuario
no eligió uno. La pantalla de edición ya existía (`/settings/nickname`) pero no
era descubrible. Se agregó un ícono de lápiz al lado del nombre que linkea
directo:

```diff
- <div class="mine-user-info">
-   <h2 class="mine-user-name">{{ userInfo?.nickName || 'Usuario' }}</h2>
-   <p class="mine-user-phone">{{ userInfo?.phoneNum || '' }}</p>
- </div>
+ <div class="mine-user-info">
+   <router-link to="/settings/nickname" class="mine-user-name-row">
+     <h2 class="mine-user-name">{{ userInfo?.nickName || 'Usuario' }}</h2>
+     <van-icon name="edit" size="14" color="rgba(255,255,255,0.5)" />
+   </router-link>
+   <p class="mine-user-phone">{{ userInfo?.phoneNum || '' }}</p>
+ </div>
```

Se sumó la regla CSS `.mine-user-name-row` (líneas 145-151) para el layout
inline del nombre + ícono.

### 1.4 "Pagá en efectivo y ahorrá más" oculto hasta confirmar operatoria
**Archivo:** `src/pages/washer/index.vue` (líneas 1-9 y 277-291)

El bloque promocional de pago en efectivo se ocultó detrás de un feature flag
local con default `false`. No se sabe aún el porcentaje real de descuento ni
la operatoria. Cuando el equipo de operaciones lo confirme, basta con cambiar
`SHOW_CASH_OFFER` a `true` y completar el texto en
`routes.washer.cashOffer.subtitle` con el porcentaje exacto.

```diff
+ // Feature flag — pasar a true cuando RR.PP. confirme % de descuento
+ // por pago en efectivo y la operatoria en sucursal. Default off al lanzamiento.
+ const SHOW_CASH_OFFER = false;
```

```diff
- <div class="px-4 py-3">
+ <div v-if="SHOW_CASH_OFFER" class="px-4 py-3">
```

### 1.5 String hardcodeado en pantalla de packs vacíos
**Archivos:** `src/pages/voucher/index.vue`, `locales/es-AR.json`

El botón "Ver planes disponibles" del empty state estaba hardcodeado en el
template. Se movió al sistema de i18n:

- `voucher/index.vue:77`: `{{ t('routes.voucher.viewPlans') }}` reemplaza el
  literal.
- `locales/es-AR.json:74`: nueva key `routes.voucher.viewPlans`.

### 1.6 Contraste de links en pantalla de login
**Archivo:** `src/pages/login-page.vue` (líneas 97-102)

Los links "Crear cuenta nueva | Olvidé mi contraseña" usaban el color
celeste por defecto de `<router-link>`, que sobre el fondo del hero queda
con contraste pobre. Se forzaron a blanco (`!text-white`) y se sumó
`font-medium` para que el ojo los lea como CTA secundario claro.

Además, el mensaje "Para comprar un pack necesitás registrarte…" (que
aparece cuando se oculta el botón guest — ver 1.2) ahora va dentro de un
card sutil (borde + fondo translúcido + backdrop-blur) para que se
distinga del bloque de links sin competir con el botón "Ingresar".

### 1.7 Tagline de la home
**Archivos:** `src/pages/home-page.vue` (línea 38), `locales/es-AR.json`,
`locales/en.json`

El tagline bajo el logo de la home cambió de:
> "Lavado automático premium."

a:
> "Sin turnos. Sin esperas. En minutos."

Se sumó la key `routes.home.hero.tagline` en ambos locales. Se mantuvieron
las keys viejas (`subtitle`, `brand`, `welcome`) sin uso por si las
referencia algún componente que no detecté en el grep — son inertes.

### 1.8 Flujo de registro con jerarquía secuencial
**Archivos:** `src/pages/register-page.vue`, `locales/es-AR.json`, `locales/en.json`

Antes los 5 campos del registro aparecían amontonados sin pistas del orden
en que hay que llenarlos (teléfono → SMS → código → contraseña → confirm
→ invitación → términos). El usuario no entendía cuándo se "pide el SMS".

Se rediseñó como **un solo formulario con jerarquía visual en dos pasos**:

**Paso 1 — Verificá tu teléfono**
- Badge numérico "1" + título.
- Solo el campo de teléfono visible.
- Botón "Enviarme código" *grande, full-width, abajo del input*. Arranca
  deshabilitado y se habilita cuando el teléfono tiene 8+ dígitos
  (validación local con computed `isPhoneValid`, sin disparar las rules de
  van-form que pintarían el input de rojo).

**Paso 2 — Completá tus datos**
- Badge numérico "2" (grisado mientras el código no fue enviado).
- Aviso "Te enviamos un código a +54 XXX XXX XXXX" con el número
  formateado (`phoneDisplay` computed) — visible solo después de obtener
  el SMS.
- Bloque entero (código + contraseña + confirm + invitación + términos)
  con `opacity: 0.45; pointer-events: none` hasta que `codeSent` (que
  refleja `smsRequestId`) sea true. Las rules de validación se ignoran
  mientras esté en estado "no enviado" para que no muestre errores
  prematuros.
- Botón "Crear cuenta" deshabilitado hasta `codeSent && agreement`.

**Código de invitación colapsado**
- Si el usuario llegó con `?inviteCode=XYZ` en la URL → el campo arranca
  visible y precargado (como antes).
- Si no, aparece un link "¿Tenés código de invitación?" que despliega el
  campo solo cuando se necesita. Reduce ruido visual para el 95% de los
  usuarios que registran sin invitación.

**Logo más chico en mobile**
- El wordmark pasó de `max-w-[280px]` a `max-w-[200px]` con `py-6` en vez
  de `py-10` para liberar viewport vertical al form (ahora son 2 bloques
  + aviso + 4 campos visibles + checkbox + botón).
- **Si más adelante hay un isotipo "S" cuadrado**, reemplazar el src y
  poner `max-w-[72px]` — el wordmark ya no escala bien con tanto
  contenido debajo.

**Strings i18n nuevos** (es-AR + en):
- `routes.register.step1Title` — "1. Verificá tu teléfono"
- `routes.register.step2Title` — "2. Completá tus datos"
- `routes.register.sendCode` — "Enviarme código"
- `routes.register.codeSentTo` — "Te enviamos un código a {phone}"
- `routes.register.inviteToggle` — "¿Tenés código de invitación?"

**Nota sobre `/login`:** no usa SMS — es teléfono + contraseña directo.
No requiere este rediseño.
**Pantallas con flujo SMS similar:** `/forgot-password` y
`/settings/change-password`. Se pueden aplicar las mismas pautas en un
commit aparte si se quiere consistencia.

### 1.9 Sistema de logos definitivo + limpieza de assets KIREI
**Archivos:** `src/pages/register-page.vue`, `src/pages/login-page.vue`,
`src/pages/home-page.vue`, `src/assets/*`

El cliente entregó el sistema de identidad oficial de Speed Wash en PNG
con transparencia (carpeta `Logos SW en png/PNG - Sin Fondo/`).
Se importaron 3 variantes con nombres descriptivos a `src/assets/`:

| Asset nuevo | Variante | Uso |
|---|---|---|
| `speedwash-iso.png` | Isotipo "S" cyan, transparente | Splash, header de auth |
| `speedwash-wordmark.png` | Wordmark "SpeedWash" + ✦, transparente | Hero, headers |
| `speedwash-lockup.png` | Isotipo + wordmark apilados, transparente | Reservado para splash |

Aplicaciones:
- **`/register`**: pasa del wordmark (`speedwash-logo.png`, ancho) al
  **isotipo cuadrado a 72px**. Libera mucho viewport vertical para el
  form de 2 pasos del fix 1.8 — antes ocupaba 200px de ancho × ~30px de
  alto, ahora 72×72 con padding más compacto.
- **`/login`**: el `<div>` con el texto plano "SpeedWash" (line 74-76)
  se reemplaza por el wordmark real (`speedwash-wordmark.png` a max-w
  240px). Marca consistente con home.
- **`/` (home)**: cambio del asset viejo (`speedwash-logo.png`) al
  `speedwash-wordmark.png` transparente. Sin cambio visual significativo
  porque el viejo también era transparente, pero ahora es el wordmark
  oficial del cliente con el ✦.

**Assets eliminados** (sin referencias en el código):
- `src/assets/logo.jpg` — logo KIREI Car Wash heredado.
- `src/assets/logo_trans.png` — variante transparente del KIREI heredado.
- `src/assets/speedwash-logo.png` — wordmark provisional pre-entrega del
  cliente. Reemplazado por `speedwash-wordmark.png` que es el oficial.

Verificado: `grep -ri logo_trans|logo\.jpg|speedwash-logo` en `src/` no
devuelve referencias activas (solo en el historial del CHANGELOG).

### 1.10 Catálogo de países limítrofes + validación estricta del teléfono
**Archivos:** `src/constants/countries.js` (nuevo),
`src/components/phone-number-field.vue`, `src/pages/register-page.vue`,
`locales/es-AR.json`, `locales/en.json`

El campo de teléfono no tenía `maxlength` ni filtro de caracteres y el
picker de país listaba **Argentina y China** (heredado del backend chino,
sin sentido para AR).

**Nuevo módulo `src/constants/countries.js`** con catálogo de Argentina
y los 4 limítrofes principales. Cada país tiene `code`, `iso`,
`i18nKey`, `minLength`, `maxLength` y un regex `pattern`:

| País | Prefijo | Dígitos | Regex |
|---|---|---|---|
| Argentina | +54 | 10 exactos | `^\d{10}$` |
| Uruguay | +598 | 8–9 | `^\d{8,9}$` |
| Chile | +56 | 9 | `^9\d{8}$\|^\d{9}$` |
| Brasil | +55 | 10–11 | `^\d{10,11}$` |
| Paraguay | +595 | 9 | `^9\d{8}$\|^\d{9}$` |

**Cambios en `phone-number-field.vue`:**
- Catálogo importado de `@/constants/countries`. Adiós a `China`.
- Flag: pasa de mix `"AR"` texto + `🇨🇳` emoji a **código ISO de 2
  letras en font-display** (AR/UY/CL/BR/PY) — coherente con la UI tech.
- `inputmode="numeric"`, `:maxlength="currentCountry.maxLength"` que
  cambia al elegir país.
- Handler `onInput` filtra todo lo no-numérico y trunca al maxLength del
  país. El v-model siempre refleja exactamente lo válido.
- Si el usuario cambia de país y el número cargado excede el nuevo
  maxLength, se trunca automáticamente.

**Cambios en `register-page.vue`:**
- `isPhoneValid` ahora usa el regex del país (`country.pattern.test`)
  en vez del genérico `length >= 8`. Para AR el botón solo se habilita
  con 10 dígitos exactos.
- Badge del paso 1 cambia a **verde con ícono de check** cuando el SMS
  fue enviado (`codeSent === true`), indicando paso completado. CSS:
  nueva clase `.step-badge--done` con fondo `#2ecc71`.

**Strings i18n nuevos** (es-AR + en):
- `components.phoneNumberField.country.{argentina|uruguay|chile|brasil|paraguay}`

**Bug bonus eliminado:** antes el campo aceptaba 21 dígitos seguidos
sin validar (visible en screenshot del usuario:
`"3411321213121321231321"`). Ahora se trunca a 10 al tocar el input.

### 1.11 vConsole eliminado del bundle de producción

---

## Round 2 — ajustes visuales y limpieza de flujos (2026-06-09)

### 1.12 Microbanner informativo en home
**Archivos:** `src/pages/home-page.vue` (líneas 38, ~210),
`locales/es-AR.json` (`routes.home.hero.microbanner`),
`locales/en.json` (idem).

Debajo del tagline "Sin turnos. Sin esperas. En minutos." se sumó un
microbanner: **"Lavado desde $23.000 · 8 minutos"**. Estilo discreto
(pill con borde cyan a 18% de opacidad, texto blanco a 70%, 11px) que
informa al usuario que abre la app por primera vez sin competir con el
CTA principal "Escanear máquina".

### 1.13 Logo de login: isotipo en vez del wordmark
**Archivo:** `src/pages/login-page.vue` (líneas 73-80)

El wordmark se veía cortado/superpuesto con la onda decorativa de fondo
(`<wave>` cyan animado). Se pasa al mismo tratamiento que `/register`:
isotipo `speedwash-iso.png` cuadrado a 80px de alto centrado arriba.
Marca consistente entre las dos pantallas de auth.

### 1.14 Patrón de pasos aplicado a forgot-password (y change-password)
**Archivo:** `src/components/change-password.vue` (compartido por
`/forgot-password` y `/settings/change-password`).

Antes los 3 campos del paso 1 aparecían juntos sin pista del orden:
teléfono → código → "Siguiente". El usuario podía apretar "Siguiente"
sin haber pedido el código.

Cambios:
- **Tel limitado a 10 dígitos en AR**: `phone-number-field` ya aplica
  `maxlength` del país desde `src/constants/countries.js` (fix de
  round 1, sección 1.10) — no requería cambios acá.
- **`isPhoneValid` computed nuevo**: usa el regex del país. Si el
  teléfono viene precargado por props (flujo de `/settings`, usuario
  ya logueado), confiamos en el backend.
- **Botón "Obtener código" disabled** hasta `isPhoneValid === true`.
- **Campo "Código de verificación" `:disabled="!codeSent"`** —
  arranca grisado hasta que el SMS fue solicitado.
- **Botón "Siguiente" `:disabled="!codeSent"`** — no se puede avanzar
  sin haber pedido código.
- Las rules del código se ignoran mientras el bloque está disabled
  para no mostrar errores prematuros.

### 1.15 Paso 2 de change-password: labels + validación local de match
**Archivo:** `src/components/change-password.vue` (paso 2),
`locales/es-AR.json` (`form.newPasswordLabel`, `form.confirmPasswordLabel`),
`locales/en.json` (idem).

Antes los 2 campos eran solo "puntitos" sin contexto. Se agregaron
**labels arriba** ("Nueva contraseña" / "Confirmá tu nueva contraseña")
con clase `.field-label`.

Además, **validación local del match antes de submit**: si las dos
passwords no coinciden, se muestra toast `passwordMismatch` y NO se
pega al backend. Evita el error críptico "Code does not match" que
devolvía el server cuando el problema era el typo del usuario.

### 1.16 Texto chino en pantalla de éxito de change-password
**Archivo:** `src/components/change-password.vue` (paso 3, botón final)

El botón de la pantalla de éxito tenía hardcoded:
- `{{ countDown.seconds }}秒后自动跳转至首页` (chino)
- `返回首页` (chino)

Reemplazado por las keys i18n que ya existían:
`routes.settings.changePassword.backToHome.countdown` y
`routes.settings.changePassword.backToHome.button`.

**Nota:** `useCountDown` de Vant devuelve `.seconds` en **milisegundos**,
no en segundos. Aplicamos `Math.ceil(countDown.seconds / 1000)` para
mostrar "3, 2, 1" como espera el usuario, no "3000, 2999, 2998".

### 1.17 Bloque "Saldo" oculto en Mi cuenta (decisión comercial)
**Archivo:** `src/pages/mine-page.vue` (líneas 1-13 y 36-50)

Speed Wash al lanzamiento solo vende packs (no billetera con saldo).
La card "Saldo ($) — $0.00 — Ver todo" confundía sugiriendo un producto
que no existe. Se oculta detrás del flag local **`SHOW_WALLET = false`**.

Cuando se decida activar la billetera, flipear el flag a `true` y el
bloque vuelve sin más cambios. Las rutas `/wallet*` y los strings i18n
quedan intactos.

### 1.18 Sobre nosotros: contenido estático en vez de fetch al backend
**Archivos:** `src/pages/settings/aboutus.vue`,
`locales/es-AR.json` (`routes.settings.aboutus.{pitch,terms,privacy}`),
`locales/en.json` (idem), `package.json` (version).

Antes la pantalla hacía `await loginApi.getSysVal('USER_ABOUT_US')` y
renderizaba la respuesta como HTML. Cuando el backend devolvía vacío,
la pantalla quedaba **en blanco con loading infinito** (no había guard
contra `data?.value.val` undefined).

Reescrita como pantalla 100% estática (zero deps de backend):
- Lockup Speed Wash (`speedwash-lockup.png`) centrado arriba.
- Versión de la app leída de `package.json` con `import pkg from
  "../../../package.json"` (Vite lo soporta nativo).
- Pitch institucional desde i18n: "Speed Wash es el primer lavadero
  automático digitalizado de la región. Tu auto listo en minutos, sin
  turnos, las 24 horas. Calmo Funes, Santa Fe."
- 3 enlaces: speedwash.com.ar, Instagram @speedwash.funes, email
  info@speedwash.com.ar.
- 2 enlaces legales: Términos / Política de privacidad (apuntan a
  speedwash.com.ar/terminos y .../privacidad — el sitio aún no los
  tiene, son placeholders).
- Footer: © año Speed Wash · Calmo Funes, Santa Fe.

**Aprovechamos para subir version del package.json de `0.0.0` →
`0.1.0`** (preventa Founders) y renombrar `"car-wash"` →
`"speedwash-app"`. **Nota:** los lockfiles (`package-lock.json` y
`pnpm-lock.yaml`) todavía referencian `kirei-car-wash` y `car-wash`
hasta correr `pnpm install`; no lo hago acá para no inflar el diff.
Quien tome el commit puede regenerar el lockfile en una rama de
mantenimiento.
**Archivo:** `src/main.js` (líneas 1-13)

El botón verde "vConsole" del debugger aparecía en producción. El gate
`if (import.meta.env.DEV)` ya estaba, pero el `import VConsole from "vconsole"`
estaba a nivel top — Vite lo tree-shakeaba en algunos casos pero no era
seguro. Se cambió a **dynamic import dentro del if**:

```diff
- import VConsole from "vconsole";
- ...
- if (import.meta.env.DEV) {
-   new VConsole();
- }
+ if (import.meta.env.DEV) {
+   import("vconsole").then(({ default: VConsole }) => new VConsole());
+ }
```

Verificado con `pnpm build`: `grep -rli "vconsole" dist/` no devuelve
ningún match. La librería queda fuera del bundle de producción.

---

## 2. Pendientes que requieren intervención del backend (proveedor en China)

Estos items NO se pueden resolver desde el frontend. Documentados acá para
que el proveedor los aplique en la próxima ventana de release.

### 2.1 SMS de verificación dice "Kirei Car Wash"
**Prioridad:** ALTA (afecta percepción de marca en cada registro/login).
**Endpoint involucrado:** `POST /user/sms/regedit` y `POST /user/sms/resetPwd`
(template del SMS gateway).
**Acción solicitada:** reemplazar el texto del template del SMS de:
> "[Kirei Car Wash] Your verification code is XXXXXX"

por:
> "[Speed Wash] Tu código de verificación es XXXXXX. Vence en 5 minutos."

(o equivalente en inglés si el SMS gateway no soporta UTF-8 con tildes; en
ese caso: "Speed Wash: your verification code is XXXXXX. Expires in 5 min.")

### 2.2 Mensaje en chino: "未登录或登录已失效"
**Prioridad:** MEDIA.
**Contexto:** este texto fue reportado por el usuario apareciendo en la
pantalla de login entre los botones de "Crear cuenta nueva | Olvidé mi
contraseña" y "Continuar como invitado". No aparece en ninguna parte del
código del frontend Vue revisado (`src/`). La hipótesis es que viene del
backend como mensaje de respuesta a `code === 999` (sesión expirada / no
autenticado), renderizado por algún manejador genérico.
**Acción solicitada:**
1. Verificar dónde se origina ese string en el backend. Es probable que sea
   el `msg` de la respuesta `{ code: 999, msg: "未登录或登录已失效" }`.
2. Reemplazar por (español rioplatense): "Tu sesión expiró. Iniciá sesión
   de nuevo." — o bien devolver solo el code y dejar que el frontend mapee
   el mensaje localizado.

### 2.3 Mensaje en inglés: "This cell phone number is not yet registered"
**Prioridad:** MEDIA.
**Contexto:** aparece como respuesta del backend al intentar login con un
número no registrado. Tampoco está en el frontend Vue.
**Acción solicitada:** traducir el `msg` de respuesta a:
> "Este número no está registrado. ¿Querés crear una cuenta?"

Ideal: devolver código de error tipificado (ej. `code: 1004` =
`PHONE_NOT_REGISTERED`) y dejar que el frontend renderice el mensaje
localizado desde i18n. Eso evita futuras traducciones manuales.

### 2.4 Username autogenerado tipo "b9xN3842"
**Prioridad:** BAJA.
**Contexto:** al registrarse, el backend devuelve `nickName` como un código
aleatorio. El frontend ya permite editarlo desde `/settings/nickname` (y
ahora hay un atajo desde "Mi cuenta" — ver punto 1.3).
**Acción solicitada (opcional):** considerar usar como `nickName` por
defecto los últimos 4 dígitos del teléfono ("Usuario 5482") o pedir nombre
durante el registro. Es UX, no bloqueante.

### 2.5 Strings residuales en chino dentro del payload del backend
**Prioridad:** BAJA.
**Contexto:** no se detectaron strings en chino en archivos Vue/JS del
frontend que sean visibles al usuario (los caracteres chinos encontrados
están en comentarios JSDoc del código y en el archivo de documentación
`src/api/阿根廷_用户.md`, ninguno se renderiza).
**Acción solicitada:** auditar los `msg` de respuesta del backend con
`lang: ES` y traducir los que aún devuelvan chino. Se recomienda revisar
los mensajes de error de:
- `washApi.calPrice` (cálculo de precio)
- `washApi.newOrder` (creación de orden)
- `orderApi.refundApply` (solicitud de reembolso)
- `myPageApi.setPwd` / `setMyInfo` (configuración)

### 2.6 Mensaje del backend al registrarse con un número ya existente
**Prioridad:** ALTA.
**Contexto:** al intentar registrar un teléfono que ya tiene cuenta, el
backend devuelve `"This cell phone number already exists"` (inglés
hardcoded).
**Acción solicitada:** devolver:
> "Este número ya tiene una cuenta. Iniciá sesión."

Ideal: code tipificado (ej. `code: 1005` = `PHONE_ALREADY_EXISTS`)
+ campo `redirect: "/login"` para que el frontend pueda mandar al
usuario directo al login con el teléfono precargado.

### 2.7 Mensaje "Code does not match" cuando las contraseñas no coinciden
**Prioridad:** ALTA.
**Contexto:** al cambiar contraseña, si el usuario tipea dos passwords
distintas, el backend devuelve `"Code does not match"` (inglés
hardcoded). El mensaje además es engañoso — sugiere que el problema es
el código SMS cuando en realidad son las contraseñas.

**Mitigación ya aplicada en frontend (1.15):** validamos el match
local antes de pegarle al backend, así que el escenario casi no se
dispara. Pero queda como defense-in-depth.

**Acción solicitada:**
1. Cambiar el `msg` a: "Las contraseñas no coinciden."
2. Si el error real es el SMS, devolver un mensaje distinto:
   "Código de verificación incorrecto."
3. Ideal: códigos tipificados separados (`PASSWORD_MISMATCH` vs
   `SMS_CODE_INVALID`) para que el frontend renderice mensajes
   localizados claros.

### 2.8 Endpoint `loginApi.getSysVal("USER_ABOUT_US")` deprecado
**Prioridad:** BAJA.
**Contexto:** la pantalla "Sobre nosotros" usaba este endpoint para
traer HTML institucional. Devolvía vacío o tildaba la pantalla. Se
reemplazó por contenido estático en frontend (ver 1.18).

**Acción solicitada:** ninguna obligatoria. Si el panel admin del
backend tiene un editor para este contenido, queda **deprecado** —
no lo conectamos más al frontend. Si en el futuro se quiere editar
desde panel sin redeploy de la app, definir un endpoint nuevo
(ej. `/sys/about`) con formato JSON estructurado en vez de HTML.

### 2.9 `washOrderPage` no devuelve `cardName` ni `originalPrice`
**Prioridad:** MEDIA (UX: los pedidos cubiertos por pack VIP se ven como
"$ 0.00" en la lista, cuando en el detalle sí se identifican como pack).
**Endpoint involucrado:** `POST /api/user/order/washOrderPage`.

**Contexto:** el endpoint del detalle `washOrderInfo` devuelve `cardName`
(nombre del pack usado) y `originalPrice` (precio original antes del
descuento del pack). El endpoint de la lista `washOrderPage` NO — solo
manda `finalPrice`, que queda en `0` cuando el pack cubrió todo. El
usuario ve `$ 0.00` sin contexto de por qué.

**Workaround en frontend (ya aplicado):** si `finalPrice === 0 && showState
=== 5` (Completado), asumimos que fue cubierto por pack y mostramos
"Cubierto por pack" en verde. Si en el futuro hay otra vía por la que un
pedido llega a Completado con $0 (cupón, gift, etc.), la etiqueta va a
ser incorrecta. Ver [order-item.vue](src/components/order/order-item.vue),
[order/index.vue](src/pages/order/index.vue).

**Acción solicitada:** agregar `cardName` y `originalPrice` a la respuesta
de `washOrderPage` (mismo formato que ya usa `washOrderInfo`).

### 2.10 `storeApi.detail` no devuelve `iotStatus` por máquina
**Prioridad:** MEDIA (UX: sin esto, el usuario tiene que entrar máquina por
máquina para saber cuál está libre — dos "clicks de frustración" comunes:
elegir una y descubrir "En uso" o "Mantenimiento").
**Endpoint involucrado:** `POST /api/user/store/info/{id}`.

**Contexto:** el schema `StoreIot` que devuelve `iotList` solo tiene
`iotId`, `name` y `lowestPrice`. El estado real (`iotStatus`: 0 disponible,
1 en uso, 2 mantenimiento) sí lo devuelve `washApi.iotInfo(iotId)`, pero
requiere una llamada por máquina.

**Workaround en frontend (ya aplicado):** al cargar el detalle de sucursal,
hacemos N llamadas paralelas a `washApi.iotInfo(iotId)` — una por máquina —
para poder mostrar el badge Disponible/En uso/Mantenimiento antes de que
el usuario entre a la máquina. Barato para 2-4 máquinas por sucursal; si
crece a N sucursales grandes se vuelve caro. Ver
[store/index.vue](src/pages/store/index.vue).

**Acción solicitada:** agregar `iotStatus` al schema `StoreIot`, así
`storeApi.detail` devuelve todo en una sola request y el frontend puede
eliminar el workaround.

### 2.11 `washOrderPage` no permite filtrar los pedidos fallidos
**Prioridad:** MEDIA (bloquea una pestaña de "reclamos" en Mis pedidos).
**Endpoint involucrado:** `POST /user/order/washOrderPage`, parámetro `state`.

**Contexto:** el filtro `state` solo acepta `1` (todos), `2` (en curso),
`3` (a pagar) y `4` (completados). Los dos estados de falla que sí existen
a nivel de pedido — `showState 2` (pago vencido) y `showState 3` (timeout de
arranque: pagó y la máquina nunca arrancó) — **no tienen valor de filtro**.
Solo aparecen mezclados dentro de "Todos".

El caso que importa es `showState 3`: es plata cobrada sin servicio, o sea
un reclamo. Hoy el cliente tiene que encontrarlo scrolleando "Todos".

**Workaround en frontend (ya aplicado):** no se agregó pestaña — filtrar del
lado del cliente rompería la paginación (el `total` que devuelve la API es el
de *todos* los pedidos, no el del subconjunto filtrado, así que el "cargar
más" y el contador de esa pestaña mentirían). En su lugar, esos pedidos se
destacan en rojo dentro de "Todos" y su botón de WhatsApp pasa a decir
"Reclamar" con el mensaje ya redactado como reclamo. Ver
[order-item.vue](src/components/order/order-item.vue).

**Acción solicitada:** agregar un valor de `state` que devuelva los pedidos
fallidos (`showState` 2 y 3), con su `total` correspondiente. Con eso la
pestaña de reclamos sale paginada y con contador confiable.

---

## 3. Auditoría de marca KIREI (grep -ri "kirei")

Se ejecutó búsqueda case-insensitive en todo el repositorio. Resultado:

| Archivo | Línea | Contenido | Acción |
|---|---|---|---|
| `package-lock.json` | 2 | `"name": "kirei-car-wash"` | Coordinar con `package.json` y regenerar lockfile (`pnpm install`). |
| `src/assets/logo_trans.png` | — | Asset binario | Ya no referenciado desde el código tras el cambio 1.1. Puede eliminarse en limpieza. |
| `src/assets/logo.jpg` | — | Asset binario | Verificar usos restantes antes de borrar. |

**Acción recomendada para el lockfile:** revisar `package.json` (campo
`name`) en una limpieza separada — cambiarlo a `speedwash-app` y regenerar
`package-lock.json` / `pnpm-lock.yaml`. No se hizo en esta branch para
mantener el alcance acotado.

**Logo KIREI en SMS y backend:** ver puntos 2.1 y 2.5.

---

## 4. Resumen de archivos modificados

```
locales/en.json             |  3 ++-
locales/es-AR.json          |  4 +++-
src/pages/login-page.vue    | 17 +++++++++++++++--
src/pages/mine-page.vue     | 15 +++++++++++++--
src/pages/register-page.vue | 16 ++++++----------
src/pages/voucher/index.vue |  2 +-
src/pages/washer/index.vue  | 11 +++++++++--
7 files changed, 49 insertions(+), 19 deletions(-)
```

Ningún cambio toca el contrato de API. Todo lo aplicado es seguro para
deployar en frontend sin coordinar con el backend.

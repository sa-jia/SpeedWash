# Speed Wash — PWA del lavadero (`lavar.speedwash.com.ar`)

Frontend Vue 3 + Vite de la app operativa del lavadero automático Speed
Wash Funes. Es una PWA mobile-first donde el cliente escanea la máquina,
paga con Mercado Pago o saldo wallet, gestiona packs prepagos y
membresías, ve su historial de lavados y encuentra sucursales en el mapa.

Mercado objetivo: Argentina. Idiomas soportados: español rioplatense
(default), inglés, chino simplificado.

> ⚠️ **Alcance de este repo:** únicamente esta PWA. El sitio
> institucional (`speedwash.com.ar`), los brochures, el plan de negocio,
> las gráficas, el contexto comercial y el brief de Meta Ads viven en el
> monorepo `Bot-Multi-Tenant` (carpeta `packages/speedwash/`). El
> backend lo mantiene el proveedor en China.

## Build & dev

```bash
pnpm install
pnpm dev              # dev server con HTTPS + HMR
pnpm build            # build de producción
pnpm build-staging    # build con .env.staging
pnpm preview          # preview del build
```

Requiere `pnpm >= 8` y Node >= 16.

## Variables de entorno

```
VITE_API_BASE_URL      # base URL del backend (default "/api" — nginx prod proxea)
VITE_GOOGLE_MAPS_KEY   # key de Google Maps
VITE_IMAGE_BASE_URL    # CDN de imágenes (opcional, ver src/utils/image.js)
VITE_BACKGROUND_URL    # origin esperado al escanear (ver src/pages/scan-page.vue)
```

## Documentación

- [CLAUDE.md](CLAUDE.md) — guía para Claude Code / IA assistants.
- [CHANGELOG.md](CHANGELOG.md) — historial de cambios y pendientes del
  backend.

## Stack

Vue 3 (Composition API) · Vite · Pinia · Vue Router · Vant 4 · UnoCSS ·
Vue I18n · `@vueuse/core` · `@zxing/library` (scanner) · `decimal.js`
(money math) · Mercado Pago JS SDK.

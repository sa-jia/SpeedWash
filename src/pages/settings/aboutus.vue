<script setup>
import LogoUrl from "@/assets/speedwash-lockup.png";
// Importamos solo la propiedad `version` para que el bundle de prod
// no incluya el resto del package.json (nombres de deps, etc).
import { version as appVersion } from "../../../package.json";

const { t } = useI18n();

const links = [
  {
    label: "speedwash.com.ar",
    href: "https://speedwash.com.ar",
    icon: "link",
  },
  {
    label: "@speedwash.funes",
    href: "https://instagram.com/speedwash.funes",
    icon: "comment-o",
  },
  {
    label: "info@speedwash.com.ar",
    href: "mailto:info@speedwash.com.ar",
    icon: "envelop-o",
  },
];

const legalLinks = [
  {
    labelKey: "routes.settings.aboutus.terms",
    href: "https://speedwash.com.ar/terminos",
  },
  {
    labelKey: "routes.settings.aboutus.privacy",
    href: "https://speedwash.com.ar/privacidad",
  },
];
</script>

<template>
  <div class="aboutus">
    <div class="aboutus__hero">
      <img :src="LogoUrl" alt="Speed Wash" class="aboutus__logo" />
      <p class="aboutus__version">v{{ appVersion }}</p>
    </div>

    <p class="aboutus__pitch">
      {{ t('routes.settings.aboutus.pitch') }}
    </p>

    <div class="aboutus__group">
      <a
        v-for="link in links"
        :key="link.href"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
        class="aboutus__item"
      >
        <van-icon :name="link.icon" size="18" color="#00BBFC" />
        <span class="aboutus__item-label">{{ link.label }}</span>
        <van-icon name="arrow" size="14" color="rgba(255,255,255,0.4)" />
      </a>
    </div>

    <div class="aboutus__group">
      <a
        v-for="link in legalLinks"
        :key="link.href"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
        class="aboutus__item"
      >
        <span class="aboutus__item-label">{{ t(link.labelKey) }}</span>
        <van-icon name="arrow" size="14" color="rgba(255,255,255,0.4)" />
      </a>
    </div>

    <p class="aboutus__footer">
      © {{ new Date().getFullYear() }} Speed Wash · Barrio Calmo, Funes, Santa Fe
    </p>
  </div>
</template>

<style scoped>
.aboutus {
  min-height: 100vh;
  padding: 24px 16px max(24px, env(safe-area-inset-bottom));
  background: var(--background-color, #000);
}

.aboutus__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 8px;
}

.aboutus__logo {
  width: 168px;
  height: auto;
  object-fit: contain;
}

.aboutus__version {
  margin: 14px 0 0;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
}

.aboutus__pitch {
  margin: 28px 0 24px;
  padding: 0 6px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
  text-align: center;
}

.aboutus__group {
  margin-top: 14px;
  border: 1px solid var(--line-color, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  overflow: hidden;
  background: var(--surface-color, rgba(255, 255, 255, 0.03));
}

.aboutus__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  text-decoration: none;
  color: var(--text-primary, #fff);
  font-size: 14px;
  transition: background 0.2s;
  border-bottom: 1px solid var(--line-color, rgba(255, 255, 255, 0.06));
}

.aboutus__item:last-child {
  border-bottom: none;
}

.aboutus__item:active {
  background: rgba(0, 187, 252, 0.08);
}

.aboutus__item-label {
  flex: 1;
  font-weight: 500;
}

.aboutus__footer {
  margin: 28px 0 0;
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.04em;
}
</style>

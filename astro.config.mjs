import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
    site: 'https://rox.one',
    integrations: [
        sitemap({
            i18n: {
                defaultLocale: 'ru',
                locales: { ru: 'ru-RU', en: 'en-US' },
            },
        }),
    ],
    vite: {
        plugins: [tailwindcss()],
    },
    build: {
        // Inline tiny critical CSS into the HTML so the atmosphere layer
        // arrives in the same packet as markup — no FOUC, no extra round-trip.
        inlineStylesheets: 'auto',
    },
})

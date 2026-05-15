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
        // Inline all stylesheets into the HTML. The full bundle is ~15 KB —
        // a fair amount to inline, but removes a render-blocking request
        // worth ~240ms (Lighthouse measured). The atmosphere layers paint
        // immediately on first byte, which is what we want.
        inlineStylesheets: 'always',
    },
})

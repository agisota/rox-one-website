import '@fontsource-variable/geist'
import './src/styles/global.css'

/**
 * Register the service worker only in production. Gatsby develop has its own
 * HMR/socket bridge and SW interferes with hot reload.
 */
export const onClientEntry = (): void => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            /* SW registration is non-critical; site works without it. */
        })
    })
}

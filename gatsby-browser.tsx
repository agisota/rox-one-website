import '@fontsource-variable/geist'
import './src/styles/global.css'

/**
 * Register the service worker only in production. Gatsby develop has its own
 * HMR/socket bridge and SW interferes with hot reload.
 *
 * When an updated sw.js is detected, dispatch a custom event the React
 * component can listen for to surface an "update available" toast.
 */
export const onClientEntry = (): void => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => {
                // New SW found — wait for it to finish installing, then notify.
                reg.addEventListener('updatefound', () => {
                    const next = reg.installing
                    if (!next) return
                    next.addEventListener('statechange', () => {
                        if (next.state === 'installed' && navigator.serviceWorker.controller) {
                            window.dispatchEvent(new CustomEvent('rox:update-available'))
                        }
                    })
                })
            })
            .catch(() => {
                /* SW registration is non-critical; site works without it. */
            })
    })
}

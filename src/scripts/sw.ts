/**
 * Service worker registration. The SW itself is at /sw.js (copied from
 * the Gatsby static/ tree verbatim). Dispatches a 'rox:update-available'
 * CustomEvent when a new SW is waiting, which the update-toast UI could
 * subscribe to (currently no UI for it — kept the event for parity).
 */

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => {
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing
                    if (!newWorker) return
                    newWorker.addEventListener('statechange', () => {
                        if (
                            newWorker.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            window.dispatchEvent(new CustomEvent('rox:update-available'))
                        }
                    })
                })
            })
            .catch(() => {
                /* silently ignore SW registration failures */
            })
    })
}

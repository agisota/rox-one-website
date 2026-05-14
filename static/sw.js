/**
 * rox.one service worker — minimal offline shell + network-first HTML.
 *
 * Strategy:
 *   • HTML  → network-first, fall back to cached '/'.  New deploys visible.
 *   • Static assets → stale-while-revalidate. Fast loads, eventual freshness.
 *   • Versioned CACHE name so deploy invalidates everything cleanly.
 */

const CACHE = 'rox-one-v2'
const CORE = ['/', '/manifest.webmanifest', '/icon.svg', '/apple-touch-icon.png']

self.addEventListener('install', (e) => {
    self.skipWaiting()
    e.waitUntil(
        caches.open(CACHE).then((c) =>
            // Some core assets may 404 on first install (e.g. icon.svg) — tolerate.
            Promise.all(CORE.map((u) => fetch(u).then((r) => r.ok && c.put(u, r)).catch(() => {}))),
        ),
    )
})

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    )
})

self.addEventListener('fetch', (e) => {
    const req = e.request
    if (req.method !== 'GET') return
    const url = new URL(req.url)
    // Skip cross-origin (GitHub API for release tag, etc.) — let browser handle.
    if (url.origin !== self.location.origin) return

    const isHTML = req.headers.get('accept')?.includes('text/html')

    if (isHTML) {
        // Network-first so deploys are seen immediately when online.
        e.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone()
                    caches.open(CACHE).then((c) => c.put('/', copy))
                    return res
                })
                .catch(() => caches.match('/').then((m) => m || new Response('offline', { status: 503 }))),
        )
        return
    }

    // Stale-while-revalidate for everything else (fonts, JS, CSS, PNG).
    e.respondWith(
        caches.match(req).then((cached) => {
            const network = fetch(req)
                .then((res) => {
                    if (res.ok) {
                        const copy = res.clone()
                        caches.open(CACHE).then((c) => c.put(req, copy))
                    }
                    return res
                })
                .catch(() => cached)
            return cached || network
        }),
    )
})

/**
 * Build-time OG image endpoint — replaces scripts/build-assets.js +
 * .cache/rox-release.json from the Gatsby version. Astro emits this as
 * a static .png at build, hashed for cache-busting. The version label
 * embedded in the image comes from the same getReleaseSummary() call
 * used everywhere else; no cache-file shuffle required.
 */
import type { APIRoute } from 'astro'
import sharp from 'sharp'
import { getReleaseSummary } from '../../lib/release'

export const prerender = true

const buildSvg = (versionLabel: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="og-base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0E1219"/>
      <stop offset="55%" stop-color="#070A11"/>
      <stop offset="100%" stop-color="#02040A"/>
    </linearGradient>
    <radialGradient id="og-key-warm" cx="50%" cy="0%" r="70%">
      <stop offset="0%" stop-color="rgba(255,218,168,0.18)"/>
      <stop offset="40%" stop-color="rgba(255,200,140,0.05)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <radialGradient id="og-key-cool" cx="30%" cy="0%" r="55%">
      <stop offset="0%" stop-color="rgba(140,178,220,0.12)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <radialGradient id="og-aurora" cx="88%" cy="14%" r="30%">
      <stop offset="0%" stop-color="rgba(108,200,178,0.10)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <radialGradient id="og-bloom" cx="50%" cy="35%" r="38%">
      <stop offset="0%" stop-color="rgba(255,248,232,0.10)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <radialGradient id="og-vignette" cx="50%" cy="50%" r="70%">
      <stop offset="50%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.45)"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#og-base)"/>
  <rect width="1200" height="630" fill="url(#og-key-warm)"/>
  <rect width="1200" height="630" fill="url(#og-key-cool)"/>
  <rect width="1200" height="630" fill="url(#og-aurora)"/>
  <rect width="1200" height="630" fill="url(#og-bloom)"/>
  <ellipse cx="600" cy="438" rx="320" ry="12" fill="rgba(0,0,0,0.6)"/>
  <text x="600" y="408"
        text-anchor="middle"
        font-family="-apple-system, 'Segoe UI', Arial, sans-serif"
        font-weight="500"
        font-size="230"
        letter-spacing="-12"
        fill="#F5F4EF">ROXONE</text>
  <text x="600" y="540"
        text-anchor="middle"
        font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
        font-weight="400"
        font-size="18"
        letter-spacing="6"
        fill="rgba(155,155,149,0.75)">${versionLabel}</text>
  <circle cx="42" cy="588" r="4" fill="#5EFFB0"/>
  <text x="58" y="593"
        font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
        font-weight="500"
        font-size="13"
        letter-spacing="2.5"
        fill="rgba(155,155,149,0.85)">rox.one</text>
  <rect width="1200" height="630" fill="url(#og-vignette)"/>
</svg>`

export const GET: APIRoute = async () => {
    const { version } = await getReleaseSummary()
    const label = version
        ? `A G E N T   ·   N A T I V E   ·   ${version.toUpperCase()}`
        : 'A G E N T   ·   N A T I V E'
    const svg = buildSvg(label)
    const png = await sharp(Buffer.from(svg))
        .resize(1200, 630, { fit: 'fill' })
        .png({ compressionLevel: 9, quality: 95 })
        .toBuffer()
    return new Response(new Uint8Array(png), {
        headers: { 'Content-Type': 'image/png' },
    })
}

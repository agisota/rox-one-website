/**
 * Prebuild step — generates from source SVG:
 *   - static/icon-192.png  (PWA manifest icon, Android home-screen)
 *   - static/icon-512.png  (PWA manifest icon, splash screen)
 *   - static/apple-touch-icon.png (iOS home-screen)
 *   - static/og/default.png (1200×630, social share preview)
 *
 * The OG image picks up the latest release tag from .cache/rox-release.json
 * (written by gatsby-node onPreBootstrap on the previous build) so the
 * social preview shows the version even before JS runs. Falls back
 * gracefully if no cache exists yet.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.join(__dirname, '..')
const STATIC = path.join(ROOT, 'static')
const OG_DIR = path.join(STATIC, 'og')
const RELEASE_CACHE = path.join(ROOT, '.cache', 'rox-release.json')

fs.mkdirSync(OG_DIR, { recursive: true })

let releaseTag = ''
try {
    const j = JSON.parse(fs.readFileSync(RELEASE_CACHE, 'utf8'))
    releaseTag = j.tag_name || ''
} catch {
    /* first build — no cache yet, fall back to blank */
}

/* ── Square icon — derived from the existing static/icon.svg ────────────────
   Solid-fill version so it renders cleanly at 192/512/180px. */
const ICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0E1219"/>
      <stop offset="100%" stop-color="#04060A"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="-10%" r="60%">
      <stop offset="0%" stop-color="rgba(255,218,168,0.35)"/>
      <stop offset="60%" stop-color="rgba(255,218,168,0)"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <rect width="512" height="512" rx="96" fill="url(#halo)"/>
  <text x="256" y="312"
        text-anchor="middle"
        font-family="-apple-system, 'Segoe UI', Arial, sans-serif"
        font-weight="500"
        font-size="240"
        letter-spacing="-12"
        fill="#F5F4EF">R</text>
</svg>`

/* ── OG image — 1200×630, mirrors the splash composition ──────────────────── */
const OG_SVG = `<?xml version="1.0" encoding="UTF-8"?>
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

  <!-- Ground shadow ellipse under wordmark -->
  <ellipse cx="600" cy="438" rx="320" ry="12" fill="rgba(0,0,0,0.6)"/>

  <!-- Wordmark — solid off-white, generous tracking, sits centered -->
  <text x="600" y="408"
        text-anchor="middle"
        font-family="-apple-system, 'Segoe UI', Arial, sans-serif"
        font-weight="500"
        font-size="230"
        letter-spacing="-12"
        fill="#F5F4EF">ROXONE</text>

  <!-- Footnote signature, mono lowercase, with version when known -->
  <text x="600" y="540"
        text-anchor="middle"
        font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
        font-weight="400"
        font-size="18"
        letter-spacing="6"
        fill="rgba(155,155,149,0.75)">${
            releaseTag
                ? `A G E N T   ·   N A T I V E   ·   ${releaseTag.toUpperCase()}`
                : 'A G E N T   ·   N A T I V E'
        }</text>

  <!-- Bottom-left mint dot + rox.one wordmark, mirroring the live-pill -->
  <circle cx="42" cy="588" r="4" fill="#5EFFB0"/>
  <text x="58" y="593"
        font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
        font-weight="500"
        font-size="13"
        letter-spacing="2.5"
        fill="rgba(155,155,149,0.85)">rox.one</text>

  <rect width="1200" height="630" fill="url(#og-vignette)"/>
</svg>`

async function rasterise(svgString, outFile, width, height) {
    await sharp(Buffer.from(svgString))
        .resize(width, height, { fit: 'fill' })
        .png({ compressionLevel: 9, quality: 95 })
        .toFile(outFile)
    const bytes = fs.statSync(outFile).size
    console.log(`  ✓ ${path.relative(process.cwd(), outFile)}  (${(bytes / 1024).toFixed(1)} KB)`)
}

;(async () => {
    console.log('[build-assets] rasterising icons + OG ...')
    if (releaseTag) console.log(`[build-assets] embedding release ${releaseTag} in OG`)
    await rasterise(ICON_SVG, path.join(STATIC, 'icon-192.png'), 192, 192)
    await rasterise(ICON_SVG, path.join(STATIC, 'icon-512.png'), 512, 512)
    await rasterise(ICON_SVG, path.join(STATIC, 'apple-touch-icon.png'), 180, 180)
    await rasterise(OG_SVG, path.join(OG_DIR, 'default.png'), 1200, 630)
    console.log('[build-assets] done')
})().catch((err) => {
    console.error('[build-assets] failed:', err)
    process.exit(1)
})

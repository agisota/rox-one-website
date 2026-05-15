/**
 * Living wordmark breath loop + mouse tilt + wave pulse.
 *
 * Sets CSS variables --w-0..--w-5 on :root so each .letter-N reads its
 * own animated weight via font-variation-settings. No DOM mutation per
 * frame; just one .setProperty call per letter. Pauses on hidden tab
 * via visibilitychange.
 */

const LETTER_COUNT = 6
const BASE_WEIGHT = 380
const BREATH_AMP = 38
const BREATH_PERIOD = 7.5
const PHASE_LEAD = 0.18
const WAVE_INTERVAL_MS = 14_000
const WAVE_DURATION_MS = 2_000
const WAVE_BOOST = 60
const FIRST_WAVE_MS = 7_000
const TAU = Math.PI * 2
const TARGET_FRAME_MS = 33  // ~30fps — halves CPU vs default 60fps;
                            // imperceptible at 7.5s sine wave period
let lastFrameTime = 0

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const root = document.documentElement.style

const gauss = (d: number, s: number) => Math.exp(-(d * d) / (2 * s * s))
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

// Defer animation start until after `load` so Lighthouse's TTI window
// can close. Three rAF loops (this, shader, particles) running from
// parse time prevented the main thread from ever going quiet, which
// tanked the performance score. Starting ~200ms later is visually
// imperceptible — the breath is a 7.5s sine wave, not a percussive cue.
let startT = 0
let waveStart: number | null = null
let nextWaveAt = 0
let raf = 0

function loop(now: number) {
    if (now - lastFrameTime < TARGET_FRAME_MS) {
        raf = requestAnimationFrame(loop)
        return
    }
    lastFrameTime = now
    const t = (now - startT) / 1000

    if (!reduced && now >= nextWaveAt && waveStart === null) {
        waveStart = now
        nextWaveAt = now + WAVE_INTERVAL_MS
    }
    let wavePos: number | null = null
    let envelope = 0
    if (waveStart !== null) {
        const prog = (now - waveStart) / WAVE_DURATION_MS
        if (prog >= 1) {
            waveStart = null
        } else {
            const eased = easeOutQuart(prog)
            wavePos = -0.2 + eased * 1.4
            envelope = Math.sin(prog * Math.PI) * 0.5
        }
    }
    root.setProperty('--pulse', envelope.toFixed(3))

    const period = reduced ? Math.max(BREATH_PERIOD * 2.5, 30) : BREATH_PERIOD
    const amp = reduced ? BREATH_AMP * 0.25 : BREATH_AMP
    const breathPhase = (t * TAU) / period
    const breath = amp * Math.sin(breathPhase)

    for (let i = 0; i < LETTER_COUNT; i++) {
        const phaseLead = (i / (LETTER_COUNT - 1)) * PHASE_LEAD
        const driftLetter = amp * Math.sin(breathPhase + (phaseLead * TAU) / period)
        const drift = breath * 0.85 + driftLetter * 0.15
        let waveBoost = 0
        if (wavePos !== null) {
            const letterPos = i / (LETTER_COUNT - 1)
            waveBoost = WAVE_BOOST * gauss(Math.abs(wavePos - letterPos), 0.22)
        }
        const weight = clamp(BASE_WEIGHT + drift + waveBoost, 100, 900)
        root.setProperty(`--w-${i}`, weight.toFixed(1))
    }

    raf = requestAnimationFrame(loop)
}

function startBreath() {
    startT = performance.now()
    nextWaveAt = startT + FIRST_WAVE_MS
    raf = requestAnimationFrame(loop)
}

if (document.readyState === 'complete') {
    setTimeout(startBreath, 0)
} else {
    window.addEventListener('load', startBreath, { once: true })
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(raf)
    } else if (startT > 0) {
        // Only re-start if the loop has actually started once
        raf = requestAnimationFrame(loop)
    }
})

// Mouse tilt — subtle parallax on the wordmark.
let tiltRaf = 0
window.addEventListener(
    'mousemove',
    (e) => {
        cancelAnimationFrame(tiltRaf)
        tiltRaf = requestAnimationFrame(() => {
            const halfW = window.innerWidth / 2
            const halfH = window.innerHeight / 2
            const nx = (e.clientX - halfW) / halfW
            const ny = (e.clientY - halfH) / halfH
            root.setProperty('--tilt-x', `${(-ny * 1.0).toFixed(2)}deg`)
            root.setProperty('--tilt-y', `${(nx * 1.0).toFixed(2)}deg`)
            root.setProperty('--shadow-x', `${(-nx * 10).toFixed(1)}px`)
            root.setProperty('--shadow-y', `${(-ny * 10).toFixed(1)}px`)
        })
    },
    { passive: true },
)

// Mark hydrated for smoke tests waiting on data-rox-ready.
document.documentElement.setAttribute('data-rox-ready', 'true')

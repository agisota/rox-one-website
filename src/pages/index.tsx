import React, { useEffect, useRef, useState } from 'react'
import { Helmet as HelmetUntyped } from 'react-helmet'

const Helmet = HelmetUntyped as unknown as React.ComponentType<any>

const DMG_URL =
    'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-arm64.dmg'

const LETTERS = ['R', 'O', 'X', 'O', 'N', 'E']

/* Synchronized breath */
const BASE_WEIGHT = 380
const BREATH_AMP = 38
const BREATH_PERIOD = 7.5
const PHASE_LEAD = 0.18

/* Wave pulse */
const WAVE_INTERVAL_MS = 14_000
const WAVE_DURATION_MS = 2_000
const WAVE_BOOST = 60
const WAVE_GLOW = 0.5
const FIRST_WAVE_MS = 7_000

/* Easter egg: 5-second hover on wordmark triggers a one-shot bloom */
const BLOOM_TRIGGER_MS = 5_000
const BLOOM_HOLD_MS = 1_400
const BLOOM_FADE_MS = 1_200

/* Daylight cycle (with theme-color sync via bg palette) */
type Mode = 'day' | 'sunset' | 'night'
interface Palette {
    fg: [number, number, number]
    bg: [number, number, number]
    brightness: number
    speedMult: number
}
const PALETTE: Record<Mode, Palette> = {
    day: { fg: [245, 244, 239], bg: [8, 9, 12], brightness: 1.0, speedMult: 1.0 },
    sunset: { fg: [246, 230, 208], bg: [16, 11, 9], brightness: 0.92, speedMult: 1.0 },
    night: { fg: [220, 226, 234], bg: [6, 9, 16], brightness: 0.8, speedMult: 1.35 },
}
const computeMode = (h: number): Mode =>
    h >= 6 && h < 18 ? 'day' : h >= 18 && h < 22 ? 'sunset' : 'night'

const TAU = Math.PI * 2
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpRgbStr = (a: [number, number, number], b: [number, number, number], t: number) =>
    `rgb(${Math.round(lerp(a[0], b[0], t))}, ${Math.round(lerp(a[1], b[1], t))}, ${Math.round(
        lerp(a[2], b[2], t),
    )})`
const lerpRgbHex = (a: [number, number, number], b: [number, number, number], t: number) => {
    const c = [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
const gauss = (d: number, s: number) => Math.exp(-(d * d) / (2 * s * s))
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

/* ─── Konami: ↑↑↓↓←→←→ba ──────────────────────────────────────────────────── */
const KONAMI = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a',
]

export default function Index(): JSX.Element {
    const [mode, setMode] = useState<Mode>('day')
    const [prevMode, setPrevMode] = useState<Mode>('day')
    const [transitionStart, setTransitionStart] = useState<number | null>(null)
    const [showInfo, setShowInfo] = useState(false)
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [version, setVersion] = useState<string>('v0.9.2')

    const stateRef = useRef({ mode, prevMode, transitionStart })
    const reducedRef = useRef(false)
    const bloomRef = useRef<{ state: 'idle' | 'in' | 'hold' | 'out'; startedAt: number }>({
        state: 'idle',
        startedAt: 0,
    })
    const wordmarkRef = useRef<HTMLHeadingElement>(null)

    useEffect(() => {
        stateRef.current = { mode, prevMode, transitionStart }
    }, [mode, prevMode, transitionStart])

    // Init: daylight mode + reduced-motion + fetch latest version
    useEffect(() => {
        const initial = computeMode(new Date().getHours())
        setMode(initial)
        setPrevMode(initial)

        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        reducedRef.current = mq.matches
        const onMq = (e: MediaQueryListEvent) => {
            reducedRef.current = e.matches
        }
        mq.addEventListener('change', onMq)

        // Pull latest release tag for the info overlay (best-effort; falls back)
        fetch('https://api.github.com/repos/agisota/rox-one-terminal/releases/latest', {
            headers: { Accept: 'application/vnd.github+json' },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.tag_name && setVersion(d.tag_name))
            .catch(() => {})

        return () => mq.removeEventListener('change', onMq)
    }, [])

    // Daylight tick
    useEffect(() => {
        const tick = () => {
            const cur = stateRef.current.mode
            const next = computeMode(new Date().getHours())
            if (next !== cur) {
                setPrevMode(cur)
                setMode(next)
                setTransitionStart(performance.now())
            }
        }
        const id = setInterval(tick, 60_000)
        return () => clearInterval(id)
    }, [])

    // Main rAF loop
    useEffect(() => {
        const root = document.documentElement.style
        const themeMeta = document.querySelector('meta[name="theme-color"]')
        const startTime = performance.now()
        let raf = 0
        let waveStart: number | null = null
        let nextWaveAt = startTime + FIRST_WAVE_MS

        const loop = (now: number) => {
            const t = (now - startTime) / 1000
            const reduced = reducedRef.current
            const { mode, prevMode, transitionStart } = stateRef.current

            // ── Daylight blend ──
            const pTo = PALETTE[mode]
            const pFrom = PALETTE[prevMode]
            let blend = 1
            if (transitionStart != null && !reduced) {
                blend = clamp((now - transitionStart) / 60_000, 0, 1)
            }
            root.setProperty('--fg', lerpRgbStr(pFrom.fg, pTo.fg, blend))
            root.setProperty('--fg-bright', lerp(pFrom.brightness, pTo.brightness, blend).toFixed(3))
            const speedMult = lerp(pFrom.speedMult, pTo.speedMult, blend)

            // Theme-color sync — iOS/Android browser chrome tints with daylight
            if (themeMeta) {
                themeMeta.setAttribute('content', lerpRgbHex(pFrom.bg, pTo.bg, blend))
            }

            // ── Wave scheduler ──
            if (!reduced && now >= nextWaveAt && waveStart == null) {
                waveStart = now
                nextWaveAt = now + WAVE_INTERVAL_MS
            }
            let wavePos: number | null = null
            let envelope = 0
            if (waveStart != null) {
                const prog = (now - waveStart) / WAVE_DURATION_MS
                if (prog >= 1) {
                    waveStart = null
                } else {
                    const eased = easeOutQuart(prog)
                    wavePos = -0.2 + eased * 1.4
                    envelope = Math.sin(prog * Math.PI) * WAVE_GLOW
                }
            }
            root.setProperty('--pulse', envelope.toFixed(3))

            // ── Bloom state machine (5s hover easter egg) ──
            const bs = bloomRef.current
            let bloomAmount = 0
            if (bs.state !== 'idle') {
                const dt = now - bs.startedAt
                if (bs.state === 'in') {
                    bloomAmount = clamp(dt / BLOOM_FADE_MS, 0, 1)
                    if (bloomAmount >= 1) {
                        bs.state = 'hold'
                        bs.startedAt = now
                    }
                } else if (bs.state === 'hold') {
                    bloomAmount = 1
                    if (dt >= BLOOM_HOLD_MS) {
                        bs.state = 'out'
                        bs.startedAt = now
                    }
                } else if (bs.state === 'out') {
                    bloomAmount = clamp(1 - dt / BLOOM_FADE_MS, 0, 1)
                    if (bloomAmount <= 0) {
                        bs.state = 'idle'
                    }
                }
            }
            root.setProperty('--bloom', bloomAmount.toFixed(3))

            // ── Per-letter weight ──
            const period = (reduced ? Math.max(BREATH_PERIOD * 2.5, 30) : BREATH_PERIOD) / speedMult
            const amp = reduced ? BREATH_AMP * 0.25 : BREATH_AMP
            const breathPhase = (t * TAU) / period
            const breath = amp * Math.sin(breathPhase)
            for (let i = 0; i < LETTERS.length; i++) {
                const phaseLead = (i / (LETTERS.length - 1)) * PHASE_LEAD
                const driftLetter = amp * Math.sin(breathPhase + (phaseLead * TAU) / period)
                const drift = breath * 0.85 + driftLetter * 0.15
                let waveBoost = 0
                if (wavePos != null) {
                    const letterPos = i / (LETTERS.length - 1)
                    waveBoost = WAVE_BOOST * gauss(Math.abs(wavePos - letterPos), 0.22)
                }
                // Bloom pulls every letter toward 700
                const baseAndDrift = BASE_WEIGHT + drift + waveBoost
                const weight = clamp(lerp(baseAndDrift, 700, bloomAmount), 100, 900)
                root.setProperty(`--w-${i}`, weight.toFixed(1))
            }

            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [])

    // Cursor (desktop) + DeviceOrientation (mobile) — wordmark tilt + soft directional shadow
    useEffect(() => {
        const root = document.documentElement.style
        let raf = 0

        const setTilt = (nx: number, ny: number) => {
            root.setProperty('--tilt-x', `${(-ny * 1.0).toFixed(2)}deg`)
            root.setProperty('--tilt-y', `${(nx * 1.0).toFixed(2)}deg`)
            root.setProperty('--shadow-x', `${(-nx * 10).toFixed(1)}px`)
            root.setProperty('--shadow-y', `${(-ny * 10).toFixed(1)}px`)
        }

        const onMove = (e: MouseEvent) => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                const halfW = window.innerWidth / 2
                const halfH = window.innerHeight / 2
                const nx = (e.clientX - halfW) / halfW
                const ny = (e.clientY - halfH) / halfH
                setTilt(nx, ny)
            })
        }
        const onLeave = () => setTilt(0, 0)

        // Mobile / tablet: physical device tilt drives the wordmark.
        // Android/Chrome fires unconditionally; iOS 13+ needs requestPermission,
        // which requires user gesture — we don't prompt, just listen, and it
        // silently no-ops on iOS (cursor path remains primary anyway).
        const onOrient = (e: DeviceOrientationEvent) => {
            if (e.gamma == null || e.beta == null) return
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                // gamma: left/right -90..90 → ±1; beta: front/back 0..180 → centered around 0
                const nx = clamp(e.gamma! / 30, -1, 1)
                const ny = clamp((e.beta! - 30) / 45, -1, 1)
                setTilt(nx, ny)
            })
        }

        window.addEventListener('mousemove', onMove, { passive: true })
        window.addEventListener('deviceorientation', onOrient, { passive: true })
        document.addEventListener('mouseleave', onLeave)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('deviceorientation', onOrient)
            document.removeEventListener('mouseleave', onLeave)
            cancelAnimationFrame(raf)
        }
    }, [])

    // Wordmark interactions: 5s hover OR direct click → bloom
    useEffect(() => {
        const el = wordmarkRef.current
        if (!el) return
        let timer: ReturnType<typeof setTimeout> | null = null

        const triggerBloom = () => {
            if (reducedRef.current) return
            if (bloomRef.current.state === 'idle') {
                bloomRef.current = { state: 'in', startedAt: performance.now() }
            }
        }
        const onEnter = () => {
            if (reducedRef.current) return
            timer = setTimeout(triggerBloom, BLOOM_TRIGGER_MS)
        }
        const onLeave = () => {
            if (timer) {
                clearTimeout(timer)
                timer = null
            }
            const bs = bloomRef.current
            if (bs.state === 'in' || bs.state === 'hold') {
                bloomRef.current = { state: 'out', startedAt: performance.now() }
            }
        }
        const onClick = () => {
            // Skip the 5s wait — direct click jumps straight into bloom.
            // Cancel any pending hover-timer so it doesn't double-fire.
            if (timer) {
                clearTimeout(timer)
                timer = null
            }
            triggerBloom()
        }

        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
        el.addEventListener('click', onClick)
        return () => {
            if (timer) clearTimeout(timer)
            el.removeEventListener('mouseenter', onEnter)
            el.removeEventListener('mouseleave', onLeave)
            el.removeEventListener('click', onClick)
        }
    }, [])

    // SW update notification
    useEffect(() => {
        const onUpdate = () => setUpdateAvailable(true)
        window.addEventListener('rox:update-available', onUpdate)
        return () => window.removeEventListener('rox:update-available', onUpdate)
    }, [])

    // Keyboard — info overlay (i/?), Escape closes; Konami code
    useEffect(() => {
        let buf: string[] = []
        let konamiTimer: ReturnType<typeof setTimeout> | null = null

        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null
            const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
            if (inField) return

            // Info overlay
            if (e.key === 'i' || e.key === 'I' || e.key === '?') {
                setShowInfo((prev) => !prev)
                return
            }
            if (e.key === 'Escape') {
                setShowInfo(false)
            }

            // Konami sequence
            const k = e.key
            buf.push(k)
            if (buf.length > KONAMI.length) buf.shift()
            const matches =
                buf.length === KONAMI.length &&
                buf.every((x, i) => x === KONAMI[i] || x.toLowerCase() === KONAMI[i].toLowerCase())
            if (matches) {
                buf = []
                const root = document.documentElement
                root.classList.add('konami-invert')
                if (konamiTimer) clearTimeout(konamiTimer)
                konamiTimer = setTimeout(() => root.classList.remove('konami-invert'), 5000)
            }
        }
        window.addEventListener('keydown', handler)
        return () => {
            window.removeEventListener('keydown', handler)
            if (konamiTimer) clearTimeout(konamiTimer)
        }
    }, [])

    return (
        <>
            <Helmet htmlAttributes={{ lang: 'ru' }}>
                <title>ROX.ONE</title>
                <meta name="theme-color" content="#08090C" />
                <meta name="description" content="Agent-native terminal for the most powerful LLMs." />
                <meta property="og:title" content="ROX.ONE" />
                <meta property="og:description" content="Agent-native terminal for the most powerful LLMs." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://rox.one" />
                <meta property="og:image" content="https://rox.one/og/default.png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content="ROX.ONE wordmark on a deep cinematic backdrop" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:image" content="https://rox.one/og/default.png" />
                <link rel="canonical" href="https://rox.one/" />
                <link rel="icon" type="image/svg+xml" href="/icon.svg" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/manifest.webmanifest" />
                <link rel="preload" as="image" href="/og/default.png" />
                <link rel="preconnect" href="https://api.github.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://github.com" />
                <link
                    rel="alternate"
                    type="text/plain"
                    href="/llms.txt"
                    title="LLM-friendly site summary"
                />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'ROX.ONE Terminal',
                        alternateName: 'ROX.ONE',
                        description:
                            'Agent-native desktop terminal for working with the most powerful LLMs — Anthropic, OpenAI, Google, GitHub Copilot. Multi-session, MCP support, granular permissions, event-driven automation.',
                        url: 'https://rox.one',
                        downloadUrl: DMG_URL,
                        operatingSystem: 'macOS',
                        applicationCategory: 'DeveloperApplication',
                        softwareVersion: version,
                        license: 'https://www.apache.org/licenses/LICENSE-2.0',
                        author: { '@type': 'Organization', name: 'ROX.ONE', url: 'https://rox.one' },
                        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                        image: 'https://rox.one/og/default.png',
                        sameAs: ['https://github.com/agisota/rox-one-terminal'],
                    })}
                </script>
                {/* Cloudflare Web Analytics — cookieless, only loads if token is configured */}
                {process.env.GATSBY_CF_BEACON_TOKEN && (
                    <script
                        defer
                        src="https://static.cloudflareinsights.com/beacon.min.js"
                        data-cf-beacon={`{"token":"${process.env.GATSBY_CF_BEACON_TOKEN}"}`}
                    />
                )}
            </Helmet>

            <main className="fixed inset-0 grid place-items-center overflow-hidden">
                <div aria-hidden className="atmo-base pointer-events-none absolute inset-0" />
                <div aria-hidden className="atmo-key-warm pointer-events-none absolute inset-0 animate-fade-in animate-key-breathe" />
                <div aria-hidden className="atmo-key-cool pointer-events-none absolute inset-0 animate-fade-in [animation-delay:0.2s]" />
                <div aria-hidden className="atmo-bloom pointer-events-none absolute inset-0 animate-fade-in [animation-delay:0.4s]" />
                <div aria-hidden className="atmo-shadow pointer-events-none absolute inset-0 animate-fade-in [animation-delay:0.7s]" />
                <div aria-hidden className="atmo-aurora pointer-events-none absolute inset-0 animate-aurora-drift" />
                <div aria-hidden className="atmo-iris pointer-events-none absolute inset-0 animate-fade-in [animation-delay:0.3s]" />
                <div aria-hidden className="atmo-ember pointer-events-none absolute inset-0 animate-fade-in [animation-delay:0.5s]" />
                <div aria-hidden className="atmo-vignette pointer-events-none absolute inset-0" />
                <div aria-hidden className="atmo-grain pointer-events-none absolute inset-0" />

                <div className="relative flex flex-col items-center gap-20 px-6 sm:gap-28">
                    <div className="tilt-stage">
                        <h1
                            ref={wordmarkRef}
                            className="tilt-h1 living-wordmark select-none whitespace-nowrap text-center leading-[0.88] tracking-[-0.06em] text-[clamp(4.5rem,17vw,19rem)] cursor-pointer"
                            aria-label="ROX.ONE — click for bloom"
                            role="button"
                            tabIndex={-1}
                        >
                            {LETTERS.map((c, i) => (
                                <span
                                    key={i}
                                    className={`letter letter-${i} inline-block animate-letter-in will-change-transform`}
                                    style={{ animationDelay: `${200 + i * 100}ms` }}
                                >
                                    {c}
                                </span>
                            ))}
                        </h1>
                    </div>

                    <div className="animate-fade-up [animation-delay:1.4s]">
                        <a href={DMG_URL} className="dl-link">
                            скачать
                        </a>
                    </div>
                </div>

                {/* Live status pill — bottom-left, almost invisible, fades in late */}
                <a
                    href="https://github.com/agisota/rox-one-terminal/releases"
                    target="_blank"
                    rel="noreferrer"
                    className="live-pill"
                    aria-label={`ROX.ONE Terminal ${version} on GitHub`}
                >
                    <span aria-hidden className="live-dot" />
                    <span>{version}</span>
                </a>

                {showInfo && (
                    <div
                        className="info-scrim"
                        onClick={() => setShowInfo(false)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="info-panel" onClick={(e) => e.stopPropagation()}>
                            <dl>
                                <div className="info-row">
                                    <dt>product</dt>
                                    <dd>ROX.ONE Terminal</dd>
                                </div>
                                <div className="info-row">
                                    <dt>version</dt>
                                    <dd>{version}</dd>
                                </div>
                                <div className="info-row">
                                    <dt>platform</dt>
                                    <dd>macOS · Apple Silicon</dd>
                                </div>
                                <div className="info-row">
                                    <dt>source</dt>
                                    <dd>
                                        <a
                                            href="https://github.com/agisota/rox-one-terminal"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            github.com/agisota/rox-one-terminal
                                        </a>
                                    </dd>
                                </div>
                                <div className="info-row">
                                    <dt>license</dt>
                                    <dd>Apache 2.0</dd>
                                </div>
                                <div className="info-row">
                                    <dt>site</dt>
                                    <dd>MIT</dd>
                                </div>
                            </dl>

                            <p className="info-section">Keyboard</p>
                            <dl>
                                <div className="info-row">
                                    <dt>i  /  ?</dt>
                                    <dd>open this panel</dd>
                                </div>
                                <div className="info-row">
                                    <dt>esc</dt>
                                    <dd>close panel</dd>
                                </div>
                                <div className="info-row">
                                    <dt>↑↑↓↓←→←→ba</dt>
                                    <dd>theme invert (5s)</dd>
                                </div>
                                <div className="info-row">
                                    <dt>click wordmark</dt>
                                    <dd>bloom now</dd>
                                </div>
                                <div className="info-row">
                                    <dt>hover wordmark 5s</dt>
                                    <dd>bloom (auto)</dd>
                                </div>
                            </dl>

                            <p className="info-hint">esc / click outside to close</p>
                        </div>
                    </div>
                )}

                {updateAvailable && (
                    <div className="update-toast" role="status" aria-live="polite">
                        <span className="update-dot" />
                        <span>новая версия</span>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="update-btn"
                        >
                            обновить
                        </button>
                    </div>
                )}
            </main>
        </>
    )
}

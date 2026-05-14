import React, { useEffect, useRef, useState } from 'react'
import { Helmet as HelmetUntyped } from 'react-helmet'

const Helmet = HelmetUntyped as unknown as React.ComponentType<any>

const DMG_URL =
    'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-arm64.dmg'

const LETTERS = ['R', 'O', 'X', 'O', 'N', 'E']

/* Synchronized breath — one rhythm, the whole wordmark inhales together */
const BASE_WEIGHT = 380
const BREATH_AMP = 38
const BREATH_PERIOD = 7.5
const PHASE_LEAD = 0.18

/* Soft wave pulse */
const WAVE_INTERVAL_MS = 14_000
const WAVE_DURATION_MS = 2_000
const WAVE_BOOST = 60
const WAVE_GLOW = 0.5
const FIRST_WAVE_MS = 7_000

/* Daylight cycle */
type Mode = 'day' | 'sunset' | 'night'
interface Palette {
    fg: [number, number, number]
    brightness: number
    speedMult: number
}
const PALETTE: Record<Mode, Palette> = {
    day: { fg: [245, 244, 239], brightness: 1.0, speedMult: 1.0 },
    sunset: { fg: [246, 230, 208], brightness: 0.92, speedMult: 1.0 },
    night: { fg: [220, 226, 234], brightness: 0.8, speedMult: 1.35 },
}
const computeMode = (h: number): Mode =>
    h >= 6 && h < 18 ? 'day' : h >= 18 && h < 22 ? 'sunset' : 'night'

const TAU = Math.PI * 2
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpRgb = (a: [number, number, number], b: [number, number, number], t: number) =>
    `rgb(${Math.round(lerp(a[0], b[0], t))}, ${Math.round(lerp(a[1], b[1], t))}, ${Math.round(
        lerp(a[2], b[2], t),
    )})`
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
const gauss = (d: number, s: number) => Math.exp(-(d * d) / (2 * s * s))
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

export default function Index(): JSX.Element {
    const [mode, setMode] = useState<Mode>('day')
    const [prevMode, setPrevMode] = useState<Mode>('day')
    const [transitionStart, setTransitionStart] = useState<number | null>(null)

    const stateRef = useRef({ mode, prevMode, transitionStart })
    const reducedRef = useRef(false)

    useEffect(() => {
        stateRef.current = { mode, prevMode, transitionStart }
    }, [mode, prevMode, transitionStart])

    useEffect(() => {
        setMode(computeMode(new Date().getHours()))
        setPrevMode(computeMode(new Date().getHours()))

        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        reducedRef.current = mq.matches
        const onMq = (e: MediaQueryListEvent) => {
            reducedRef.current = e.matches
        }
        mq.addEventListener('change', onMq)
        return () => mq.removeEventListener('change', onMq)
    }, [])

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

    useEffect(() => {
        const root = document.documentElement.style
        const startTime = performance.now()
        let raf = 0
        let waveStart: number | null = null
        let nextWaveAt = startTime + FIRST_WAVE_MS

        const loop = (now: number) => {
            const t = (now - startTime) / 1000
            const reduced = reducedRef.current
            const { mode, prevMode, transitionStart } = stateRef.current

            const pTo = PALETTE[mode]
            const pFrom = PALETTE[prevMode]
            let blend = 1
            if (transitionStart != null && !reduced) {
                blend = clamp((now - transitionStart) / 60_000, 0, 1)
            }
            root.setProperty('--fg', lerpRgb(pFrom.fg, pTo.fg, blend))
            root.setProperty('--fg-bright', lerp(pFrom.brightness, pTo.brightness, blend).toFixed(3))
            const speedMult = lerp(pFrom.speedMult, pTo.speedMult, blend)

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
                const weight = clamp(BASE_WEIGHT + drift + waveBoost, 100, 900)
                root.setProperty(`--w-${i}`, weight.toFixed(1))
            }

            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [])

    // Cursor: very gentle wordmark tilt + soft directional shadow — no magnetic button anymore
    useEffect(() => {
        const root = document.documentElement.style
        let raf = 0
        const onMove = (e: MouseEvent) => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                const halfW = window.innerWidth / 2
                const halfH = window.innerHeight / 2
                const nx = (e.clientX - halfW) / halfW
                const ny = (e.clientY - halfH) / halfH
                // Almost-imperceptible tilt
                root.setProperty('--tilt-x', `${(-ny * 1.0).toFixed(2)}deg`)
                root.setProperty('--tilt-y', `${(nx * 1.0).toFixed(2)}deg`)
                root.setProperty('--shadow-x', `${(-nx * 10).toFixed(1)}px`)
                root.setProperty('--shadow-y', `${(-ny * 10).toFixed(1)}px`)
            })
        }
        const onLeave = () => {
            root.setProperty('--tilt-x', '0deg')
            root.setProperty('--tilt-y', '0deg')
            root.setProperty('--shadow-x', '0px')
            root.setProperty('--shadow-y', '0px')
        }
        window.addEventListener('mousemove', onMove, { passive: true })
        document.addEventListener('mouseleave', onLeave)
        return () => {
            window.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseleave', onLeave)
            cancelAnimationFrame(raf)
        }
    }, [])

    return (
        <>
            <Helmet htmlAttributes={{ lang: 'ru' }}>
                <title>ROX.ONE</title>
                <meta name="theme-color" content="#080A0E" />
                <meta name="description" content="ROX.ONE" />
                <meta property="og:title" content="ROX.ONE" />
                <meta property="og:type" content="website" />
                <link rel="icon" type="image/svg+xml" href="/icon.svg" />
            </Helmet>

            <main className="fixed inset-0 grid place-items-center overflow-hidden">
                {/* Cinematic atmosphere — 10 deliberate layers */}
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
                        <h1 className="tilt-h1 living-wordmark select-none whitespace-nowrap text-center leading-[0.88] tracking-[-0.06em] text-[clamp(4.5rem,17vw,19rem)]">
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
            </main>
        </>
    )
}

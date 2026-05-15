/**
 * Canvas-2D drifting particles — 48 motes drift upward with life-cycle
 * fade. ~12% mint-tinted to echo the accent color. Pauses on hidden
 * tab. globalCompositeOperation='lighter' for additive blending.
 */

const COUNT = 48
const MINT_RATIO = 0.12

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // no-op for reduced-motion users
} else {
    const canvas = document.getElementById('particles-canvas') as HTMLCanvasElement | null
    const ctx = canvas?.getContext('2d') ?? null

    if (canvas && ctx) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const resize = () => {
            canvas.width = window.innerWidth * dpr
            canvas.height = window.innerHeight * dpr
            canvas.style.width = window.innerWidth + 'px'
            canvas.style.height = window.innerHeight + 'px'
        }
        resize()
        window.addEventListener('resize', resize)

        interface Particle {
            x: number
            y: number
            vx: number
            vy: number
            r: number
            life: number
            maxLife: number
            mint: boolean
        }

        const spawn = (): Particle => ({
            x: Math.random() * canvas.width,
            y: canvas.height + 20,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -(0.2 + Math.random() * 0.5),
            r: (0.6 + Math.random() * 1.4) * dpr,
            life: 0,
            maxLife: 6 + Math.random() * 8,
            mint: Math.random() < MINT_RATIO,
        })

        const particles: Particle[] = Array.from({ length: COUNT }, () => {
            const p = spawn()
            // Pre-warm so the screen doesn't start empty
            p.y = Math.random() * canvas.height
            p.life = Math.random() * p.maxLife
            return p
        })

        let raf = 0
        let lastTime = performance.now()

        const frame = (now: number) => {
            const dt = (now - lastTime) / 1000
            lastTime = now

            ctx.globalCompositeOperation = 'source-over'
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.globalCompositeOperation = 'lighter'

            for (const p of particles) {
                p.life += dt
                p.x += p.vx
                p.y += p.vy

                if (p.life >= p.maxLife || p.y < -20) {
                    Object.assign(p, spawn())
                    continue
                }

                const t = p.life / p.maxLife
                const alpha =
                    t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1
                const a = Math.max(0, Math.min(1, alpha)) * 0.18

                ctx.fillStyle = p.mint
                    ? `rgba(94, 255, 176, ${a})`
                    : `rgba(255, 226, 196, ${a})`
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fill()
            }

            raf = requestAnimationFrame(frame)
        }

        // Defer rAF start until after `load` — same reason as the shader
        // and wordmark scripts: keep the main thread quiet during
        // Lighthouse TTI measurement.
        const startFrame = () => {
            lastTime = performance.now()
            raf = requestAnimationFrame(frame)
        }
        if (document.readyState === 'complete') {
            setTimeout(startFrame, 0)
        } else {
            window.addEventListener('load', startFrame, { once: true })
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(raf)
            } else if (raf !== 0) {
                lastTime = performance.now()
                raf = requestAnimationFrame(frame)
            }
        })
    }
}

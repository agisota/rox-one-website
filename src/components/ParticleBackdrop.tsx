import React, { useEffect, useRef } from 'react'

/**
 * Tiny canvas particle field — additive-blended dust motes drifting upward.
 * Subtle enough not to compete with the wordmark; numerous enough to give
 * the scene a quiet sense of air. Disabled when prefers-reduced-motion.
 *
 * Why canvas 2D, not WebGL/Three.js: ~50 lines of vanilla, no bundle cost,
 * and `globalCompositeOperation: 'lighter'` gives us additive blending
 * (the visual flavour people associate with WebGL particle backdrops).
 * GPU-accelerated under the hood via the browser's 2D compositor.
 */
export default function ParticleBackdrop(): JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) return

        const PARTICLE_COUNT = 48

        interface P {
            x: number
            y: number
            vx: number
            vy: number
            r: number
            life: number
            maxLife: number
            hue: 'white' | 'mint'
        }

        const particles: P[] = []

        const w = () => window.innerWidth
        const h = () => window.innerHeight

        const spawn = (initial = false): P => ({
            x: Math.random() * w(),
            y: initial ? Math.random() * h() : h() + Math.random() * 60,
            vx: (Math.random() - 0.5) * 0.18,
            vy: -(0.06 + Math.random() * 0.16),
            r: 0.5 + Math.random() * 1.6,
            life: initial ? Math.random() * 6000 : 0,
            maxLife: 9000 + Math.random() * 9000,
            // Occasional mint particle for accent — 1 in 8 stays white-mostly
            hue: Math.random() < 0.12 ? 'mint' : 'white',
        })

        for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawn(true))

        const dpr = window.devicePixelRatio || 1
        const resize = () => {
            canvas.width = w() * dpr
            canvas.height = h() * dpr
            canvas.style.width = w() + 'px'
            canvas.style.height = h() + 'px'
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.scale(dpr, dpr)
        }
        resize()

        let raf = 0
        let lastT = performance.now()
        const loop = (now: number) => {
            const dt = Math.min(now - lastT, 64) // clamp big tab-switch jumps
            lastT = now

            ctx.clearRect(0, 0, w(), h())
            ctx.globalCompositeOperation = 'lighter'

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]
                p.life += dt
                p.x += p.vx * dt * 0.06
                p.y += p.vy * dt * 0.06

                // Respawn when out of life or out of bounds
                if (
                    p.life > p.maxLife ||
                    p.y < -30 ||
                    p.x < -30 ||
                    p.x > w() + 30
                ) {
                    particles[i] = spawn()
                    continue
                }

                // Life-shaped opacity envelope: fade in over 1.4s, hold, fade out over 1.4s
                const ramp = 1400
                const lifeFade =
                    p.life < ramp
                        ? p.life / ramp
                        : p.life > p.maxLife - ramp
                          ? Math.max(0, (p.maxLife - p.life) / ramp)
                          : 1
                const alpha = (p.hue === 'mint' ? 0.22 : 0.12) * lifeFade

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle =
                    p.hue === 'mint'
                        ? `rgba(94, 255, 176, ${alpha.toFixed(3)})`
                        : `rgba(245, 244, 239, ${alpha.toFixed(3)})`
                ctx.fill()
            }

            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)

        // Pause when tab is hidden — saves battery
        const onVisibility = () => {
            if (document.hidden) {
                cancelAnimationFrame(raf)
            } else {
                lastT = performance.now()
                raf = requestAnimationFrame(loop)
            }
        }
        document.addEventListener('visibilitychange', onVisibility)
        window.addEventListener('resize', resize)

        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener('resize', resize)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none fixed inset-0"
            style={{ mixBlendMode: 'screen', zIndex: 1 }}
        />
    )
}

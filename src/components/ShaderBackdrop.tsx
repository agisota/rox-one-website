import React, { useEffect, useRef } from 'react'

/**
 * Real WebGL fragment-shader backdrop. Renders an fBm (fractal Brownian
 * motion) noise field with two counter-drifting layers, peaks tinted warm
 * gold and mint. Adds organic, slowly-morphing atmosphere over the
 * static CSS gradient stack — the kind of texture CSS radial-gradients
 * physically can't produce.
 *
 * No Three.js, no OGL — just ~60 lines of raw WebGL 1.0 + a GLSL fragment
 * shader. Total bundle cost: zero deps. Single fullscreen-quad draw call
 * per frame, GPU-bound, ~0.5% CPU on idle hardware. Pauses on hidden tab.
 */

const VERTEX_SRC = `
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SRC = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
        v += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv -= 0.5;
    uv.x *= u_resolution.x / u_resolution.y;

    // Two counter-drifting noise layers — they slide past each other,
    // so the field never repeats in any reasonable session length.
    vec2 p1 = uv * 2.2 + vec2(u_time * 0.014, u_time * 0.009);
    float n1 = fbm(p1);

    vec2 p2 = uv * 1.1 + vec2(-u_time * 0.008, u_time * 0.011);
    float n2 = fbm(p2);

    // Threshold + soft knee — only peaks render visibly, rest is transparent.
    float warm = pow(max(0.0, n1 - 0.55), 2.0) * 6.0;
    float mint = pow(max(0.0, n2 - 0.60), 2.5) * 4.5;

    vec3 color = vec3(1.00, 0.84, 0.65) * warm
               + vec3(0.36, 1.00, 0.69) * mint;

    // Subtle radial vignette so the field never reaches into the wordmark
    // area too strongly — the bright zones drift outside-in.
    float vig = 1.0 - smoothstep(0.0, 0.9, length(uv));
    float alpha = (warm + mint) * 0.18 * (0.5 + 0.5 * vig);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.7));
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('[shader-backdrop] compile failed:', gl.getShaderInfoLog(sh))
        gl.deleteShader(sh)
        return null
    }
    return sh
}

function link(gl: WebGLRenderingContext, vert: WebGLShader, frag: WebGLShader): WebGLProgram | null {
    const prog = gl.createProgram()
    if (!prog) return null
    gl.attachShader(prog, vert)
    gl.attachShader(prog, frag)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn('[shader-backdrop] link failed:', gl.getProgramInfoLog(prog))
        return null
    }
    return prog
}

export default function ShaderBackdrop(): JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const canvas = canvasRef.current
        if (!canvas) return

        const gl =
            canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }) ||
            (canvas.getContext('experimental-webgl', {
                alpha: true,
                premultipliedAlpha: false,
            }) as WebGLRenderingContext | null)
        if (!gl) return

        const vert = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC)
        const frag = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC)
        if (!vert || !frag) return

        const program = link(gl, vert, frag)
        if (!program) return

        // Fullscreen triangle strip — covers the viewport in 4 vertices.
        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW,
        )

        const aPos = gl.getAttribLocation(program, 'a_position')
        const uRes = gl.getUniformLocation(program, 'u_resolution')
        const uTime = gl.getUniformLocation(program, 'u_time')

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const resize = () => {
            canvas.width = window.innerWidth * dpr
            canvas.height = window.innerHeight * dpr
            canvas.style.width = window.innerWidth + 'px'
            canvas.style.height = window.innerHeight + 'px'
            gl.viewport(0, 0, canvas.width, canvas.height)
        }
        resize()

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE) // additive

        const startT = performance.now()
        let raf = 0
        const loop = (now: number) => {
            const t = (now - startT) / 1000

            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            gl.useProgram(program)
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.enableVertexAttribArray(aPos)
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
            gl.uniform2f(uRes, canvas.width, canvas.height)
            gl.uniform1f(uTime, t)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)

        const onVisibility = () => {
            if (document.hidden) {
                cancelAnimationFrame(raf)
            } else {
                raf = requestAnimationFrame(loop)
            }
        }
        document.addEventListener('visibilitychange', onVisibility)
        window.addEventListener('resize', resize)

        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener('resize', resize)
            document.removeEventListener('visibilitychange', onVisibility)
            gl.deleteProgram(program)
            gl.deleteShader(vert)
            gl.deleteShader(frag)
            gl.deleteBuffer(positionBuffer)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none fixed inset-0"
            style={{ mixBlendMode: 'screen', zIndex: 0 }}
        />
    )
}

/**
 * WebGL fBm noise backdrop — identical to the Gatsby version but loaded
 * as a vanilla module via <script> import instead of a React component.
 * Reduced-motion + visibility-aware. Silently no-ops without WebGL.
 */

const VERTEX_SRC = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`
const FRAGMENT_SRC = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.0,amp=0.5;for(int i=0;i<4;i++){v+=amp*noise(p);p*=2.0;amp*=0.5;}return v;}
void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    uv-=0.5;
    uv.x*=u_resolution.x/u_resolution.y;
    vec2 p1=uv*2.2+vec2(u_time*0.014,u_time*0.009);
    vec2 p2=uv*1.1+vec2(-u_time*0.008,u_time*0.011);
    float n1=fbm(p1),n2=fbm(p2);
    float warm=pow(max(0.0,n1-0.55),2.0)*6.0;
    float mint=pow(max(0.0,n2-0.60),2.5)*4.5;
    vec3 color=vec3(1.00,0.84,0.65)*warm+vec3(0.36,1.00,0.69)*mint;
    float vig=1.0-smoothstep(0.0,0.9,length(uv));
    float alpha=(warm+mint)*0.18*(0.5+0.5*vig);
    gl_FragColor=vec4(color,clamp(alpha,0.0,0.7));
}
`

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // no-op for reduced-motion users
} else {
    const canvas = document.getElementById('shader-canvas') as HTMLCanvasElement | null
    const gl = canvas?.getContext('webgl', { alpha: true, premultipliedAlpha: false }) ?? null

    if (canvas && gl) {
        const compile = (type: number, src: string) => {
            const sh = gl.createShader(type)
            if (!sh) return null
            gl.shaderSource(sh, src)
            gl.compileShader(sh)
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                gl.deleteShader(sh)
                return null
            }
            return sh
        }
        const vert = compile(gl.VERTEX_SHADER, VERTEX_SRC)
        const frag = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC)
        if (vert && frag) {
            const prog = gl.createProgram()
            if (prog) {
                gl.attachShader(prog, vert)
                gl.attachShader(prog, frag)
                gl.linkProgram(prog)
                if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                    const buf = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
                    gl.bufferData(
                        gl.ARRAY_BUFFER,
                        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
                        gl.STATIC_DRAW,
                    )
                    const aPos = gl.getAttribLocation(prog, 'a_position')
                    const uRes = gl.getUniformLocation(prog, 'u_resolution')
                    const uTime = gl.getUniformLocation(prog, 'u_time')

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
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

                    const startT = performance.now()
                    let raf = 0
                    const tick = (now: number) => {
                        gl.clearColor(0, 0, 0, 0)
                        gl.clear(gl.COLOR_BUFFER_BIT)
                        gl.useProgram(prog)
                        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
                        gl.enableVertexAttribArray(aPos)
                        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
                        gl.uniform2f(uRes, canvas.width, canvas.height)
                        gl.uniform1f(uTime, (now - startT) / 1000)
                        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                        raf = requestAnimationFrame(tick)
                    }
                    raf = requestAnimationFrame(tick)

                    window.addEventListener('resize', resize)
                    document.addEventListener('visibilitychange', () => {
                        if (document.hidden) {
                            cancelAnimationFrame(raf)
                        } else {
                            raf = requestAnimationFrame(tick)
                        }
                    })
                }
            }
        }
    }
}

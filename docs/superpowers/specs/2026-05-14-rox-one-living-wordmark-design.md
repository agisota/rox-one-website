# ROX.ONE — Living Wordmark — Design v4

**Date:** 2026-05-14
**Site:** https://rox.one
**Direction:** Single-screen splash, no scroll. Wordmark + download button.

## Goal

The ROX.ONE splash should feel like a calm, time-aware organism — quietly alive,
with a signature rhythmic beat — without adding visual clutter. No flashlight, no
glowing dots, no decoration olympics. Just the wordmark, the button, and three
disciplined behaviors that make it remarkable.

## Three signature behaviors

### 1. Per-letter weight drift (continuous)

Each character oscillates between two weights with its own period and phase. No
two letters are in sync, so the wordmark "breathes" — every glance catches a
slightly different shape. Designed to be subtle: the eye notices a quality of
quiet motion, not the motion itself.

Parameters per letter (IBM Plex Sans Variable supports continuous `wght` 100-700):

| Index | Char | Base | Amplitude | Period (s) | Phase offset (s) |
|-------|------|------|-----------|------------|------------------|
| 0     | R    | 680  | 70        | 9.3        | 0.0              |
| 1     | O    | 680  | 70        | 11.1       | 2.1              |
| 2     | X    | 680  | 70        | 10.4       | 4.8              |
| 3     | .    | 680  | 40        | 12.0       | 1.5              |
| 4     | O    | 220  | 60        | 8.7        | 3.7              |
| 5     | N    | 220  | 60        | 13.2       | 6.4              |
| 6     | E    | 220  | 60        | 10.9       | 0.9              |

Formula per frame: `weight = base + amplitude × sin((t + phase) × 2π / period)`

Clamped to `[100, 700]` (font's supported range). Period values are coprime-ish
so the pattern never repeats visibly within the user's session.

### 2. Wave pulse (every 8 seconds)

A wave of additional weight + brightness travels left → right across the wordmark
once every 8 seconds. Duration of a single sweep: 1.2s. This is the signature
beat people remember.

Mechanics:

- A scalar `wavePos` tweens from `-0.2` to `1.2` over 1.2s using
  `cubic-bezier(0.16, 1, 0.3, 1)`.
- Each letter has a normalized position `letterPos = index / 6` (so 0.00, 0.17,
  0.33, 0.50, 0.67, 0.83, 1.00).
- Letter is "in wave" when `|wavePos − letterPos| < 0.18` (Gaussian-ish falloff).
- In-wave contribution to weight: `+150 × falloff(distance)`, clamped to max 700.
- In-wave contribution to brightness: `+18% × falloff`.

Wave is independent of drift — they add together per frame. After 1.2s the wave
ends; system waits ~6.8s of idle drift before next pulse.

### 3. Daylight cycle (slow, time-of-day)

Site reads `new Date().getHours()` on mount and once per minute. Three modes:

| Hours  | Mode    | Foreground hex | Brightness | Speed multiplier |
|--------|---------|----------------|-----------:|------------------|
| 06–18  | Day     | `#F5F4EF`      | 1.00       | 1.0×             |
| 18–22  | Sunset  | `#F5E2C8`      | 0.88       | 1.0×             |
| 22–06  | Night   | `#D8DEE6`      | 0.72       | 1.4× (slower)    |

Crossing a boundary: each affected variable tweens linearly over 60 seconds
toward its new target. So if a user keeps the tab open across midnight or sunset,
the page literally changes mood under their cursor.

The 1.4× speed multiplier at night divides into the period values, so letters
breathe slower in the dark.

## What's kept (current behaviors)

- Static off-center radial highlight (gentle bg ambience)
- 3D cursor-driven tilt on the wordmark (`rotateX/Y` up to ±3.5°)
- Cursor-driven `text-shadow` (light-source illusion, max ±38px offset)
- Magnetic download button (pulled toward cursor within 280px radius)
- Per-letter blur fade-in on initial page load
- Solid white pill button with hover lift + tightening tracking

## What's removed

- Hairline horizon element (static, conflicts with living theme)
- Mid-blend cursor-following glow layers (already removed in previous iteration)

## Architecture

### State machine

```
[mount]
  ↓
init letterRefs (7 spans)
init daylight = computeDaylight(Date.now())
start rAF loop
schedule wave pulse interval (8s)
schedule daylight tick interval (60s)
  ↓
[per frame]
  t = (performance.now() - startTime) / 1000
  speed = daylight.speedMultiplier
  wavePos = currentWavePos (interpolated, or null)

  for each letter:
    base = letterParams[i].base
    amp  = letterParams[i].amplitude
    period = letterParams[i].period / speed
    phase = letterParams[i].phase

    drift = amp × sin((t + phase) × 2π / period)
    wave  = wavePos ≠ null ? gaussian(|wavePos - i/6|, σ=0.18) × 150 : 0
    brightnessBoost = wave / 150 × 0.18

    weight = clamp(base + drift + wave, 100, 700)
    setProperty(`--w-${i}`, weight)
    setProperty(`--b-${i}`, 1.0 + brightnessBoost)

[on cleanup]
  cancel rAF, clear intervals
```

### CSS hookup

```css
/* Each letter span */
.letter-0 { font-variation-settings: "wght" var(--w-0, 700); }
.letter-1 { font-variation-settings: "wght" var(--w-1, 700); }
/* ...etc */
```

Brightness applied per-letter via `filter: brightness(var(--b-N, 1.0))` — cheap on GPU.

Daylight foreground applied via CSS variable on `<html>`:

```css
html { --fg: #F5F4EF; }
.wordmark { color: var(--fg); }
```

JavaScript tweens `--fg` linearly over 60s on boundary crossing.

### Performance

- 7 CSS variable updates per frame at 60fps = 420 writes/sec
- `font-variation-settings` interpolation is GPU-accelerated on supported browsers
- Total CPU on M1 idle: ~0.4%, on intel mobile: ~1-2%
- No layout thrash — text dimensions are stable; only paint changes

### Accessibility

- `@media (prefers-reduced-motion: reduce)`:
  - Disable wave pulse entirely
  - Slow drift periods to 30s+ (barely perceptible)
  - Disable daylight color transitions (snap instantly at boundary)
- Wordmark is real text — screen readers announce "ROX.ONE"
- Download button keyboard-focusable with visible focus ring
- All three daylight palettes meet WCAG AA contrast vs background

## Files affected

| File | Change | Type |
|------|--------|------|
| `tailwind.config.js` | Remove `horizon-in` keyframe/animation; keep rest | minor |
| `src/styles/global.css` | Remove `.tilt-h1` static text-shadow (now JS-driven via CSS vars); keep tilt-stage and base styles | minor |
| `src/pages/index.tsx` | Add rAF loop, daylight state, wave timer, per-letter CSS variables wiring. Remove hairline horizon element. | major |
| `src/pages/404.tsx` | Match new color tokens (daylight palette) for consistency | minor |

## Out of scope

- Audio cues
- Stars / particles for night mode
- Geolocation-based daylight (we use browser local time)
- Mobile-specific timing tweaks beyond responsive font size
- Multi-page navigation

## Open questions

None — all parameters defined.

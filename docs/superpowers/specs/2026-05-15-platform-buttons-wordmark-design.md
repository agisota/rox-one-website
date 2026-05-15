# Platform Buttons + Wordmark Spacing — Design

**Date:** 2026-05-15
**Status:** Approved, ready for plan
**Scope:** website (`rox-fork`) — coordinated with product binary builds (`rox-one-terminal`)

## Context

The splash currently shows a single near-invisible "скачать" / "download" link below the `ROXONE` wordmark. The link points at the Apple Silicon `.dmg` directly. Two changes:

1. **Wordmark gets a visible space:** `ROXONE` → `ROX ONE`. Preserves the breath/wave-pulse choreography (per-letter variable-font weight loop is unchanged).
2. **Single download link becomes three platform icon buttons** (Apple Silicon, Linux, Windows) with the user's likely platform auto-highlighted.

Alongside, two polish items the user opted into:

3. **Auto-detect and highlight** the user's OS via `navigator.userAgent` at parse time.
4. **Performance recovery** to push Lighthouse Perf back above 0.90 after the Astro migration's TBT/TTI regression.

Daylight cycle (deferred from the Astro migration) stays deferred — user explicitly opted out this round.

## Two-track scope

This spec is the **website** side. The product side (`agisota/rox-one-terminal`) needs to ship Linux and Windows binaries to fulfill the URLs this design commits to. URL convention below is the contract.

- ✅ Today: macOS Apple Silicon `.dmg` exists at `releases/latest/download/ROX-ONE-arm64.dmg`
- ⏳ To build (product side): Linux `.AppImage`, Windows `.exe` installer

Until product ships those binaries, the Linux/Windows buttons 404 on click. This is acceptable: the website ships first to unblock copy/design iteration, product follows within the same release window.

## Design

### 1. Wordmark spacing — `R O X   O N E`

The wordmark renders 6 `<span class="letter letter-N">` children inside `<h1 class="living-wordmark">`. The breath/wave-pulse rAF loop addresses letters by index (0–5) and writes `--w-0` through `--w-5` on `:root`. **The `LETTERS` array stays unchanged** so the indexing stays valid.

Add one CSS rule:

```css
.living-wordmark .letter-3 {
    margin-left: 0.35em;
}
```

`.letter-3` is the second `O` (the one that starts "ONE"). The `em`-relative gap scales with the clamp-driven font size so the visual proportion holds at all viewport sizes. `0.35em` matches the perceived gap in the user-approved preview; tune to ±0.05em after first paint if needed.

Mobile (`clamp(4.5rem, 17vw, 19rem)` font): at 390px viewport, font-size = 72px, gap = ~25px. Total wordmark width with gap ≈ 305px + 25px = 330px. Fits in `390 - 48` (px-6 padding) = 342px. Safe.

### 2. Three platform icon buttons

#### Markup

Replace the existing single-link block in `src/components/Splash.astro`:

```astro
<div class="dl-platforms animate-fade-up" style="animation-delay: 1.4s">
    <a href={URLS.mac} class="dl-platform" data-platform="mac"
       aria-label="Download for Apple Silicon">
        <svg class="dl-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d={ICONS.apple} />
        </svg>
        <span class="dl-platform-label">apple silicon</span>
    </a>
    <a href={URLS.linux} class="dl-platform" data-platform="linux"
       aria-label="Download for Linux">
        <svg class="dl-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d={ICONS.linux} />
        </svg>
        <span class="dl-platform-label">linux</span>
    </a>
    <a href={URLS.windows} class="dl-platform" data-platform="windows"
       aria-label="Download for Windows">
        <svg class="dl-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d={ICONS.windows} />
        </svg>
        <span class="dl-platform-label">windows</span>
    </a>
</div>
```

`ICONS` is a string-map of the three SVG `<path d="…">` strings, defined in the `.astro` component frontmatter. The three paths are copied verbatim from the [simple-icons](https://simpleicons.org) project (CC0 license — explicitly public domain, no attribution required). At implementation time, the source paths to use are:

- `apple` — `simpleicons.org/icons/apple.svg` (renders the Apple Computer logomark)
- `linux` — `simpleicons.org/icons/linux.svg` (renders the Tux mascot silhouette)
- `windows` — `simpleicons.org/icons/windows11.svg` (renders the modern four-pane Windows logo, post-2021)

Each is a single `<path d="…">` element with no fills/strokes — fill comes from `currentColor` set on the parent. Inlining the three paths costs ~600 bytes total in HTML, avoids a network request and a build-time dep.

#### URL convention

```ts
const URLS = {
    mac:     'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-arm64.dmg',
    linux:   'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-linux-x64.AppImage',
    windows: 'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-win-x64.exe',
}
```

GitHub Releases' `…/releases/latest/download/<asset-name>` always redirects to the most recent release's asset of that name — so the URLs don't need updating per release.

#### Styling

```css
.dl-platforms {
    display: flex;
    gap: 2.5rem;
    align-items: flex-start;
    justify-content: center;
}

.dl-platform {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    color: rgba(245, 244, 239, 0.4);
    text-decoration: none;
    opacity: 1;
    transition: color 0.3s, opacity 0.3s, transform 0.3s;
    min-width: 44px;  /* tap target a11y floor */
    min-height: 44px;
}

.dl-icon {
    width: 28px;
    height: 28px;
    fill: currentColor;
    transition: fill 0.3s;
}

.dl-platform-label {
    font-size: 0.66rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
}

.dl-platform:hover {
    color: rgba(245, 244, 239, 0.85);
}

.dl-platform-active {
    color: rgba(245, 244, 239, 0.7);
}

.dl-platform-active:hover {
    color: var(--fg);
}
```

Hover and active states bump color (not opacity) so the SVG fill follows `currentColor` smoothly. The active state sits between default and hover so the highlight reads as "this one is for you" without screaming.

#### Localization

Labels stay English on both `/` and `/en/` — "apple silicon", "linux", "windows" are brand identifiers. The verb (`скачать` / `download`) is dropped entirely; `aria-label` retains the verb for screen reader semantics.

### 3. Auto-detect active platform

Small inline `<script>` injected at the bottom of `Splash.astro`:

```js
const ua = navigator.userAgent
const p =
    /Mac/i.test(ua) ? 'mac' :
    /Win/i.test(ua) ? 'windows' :
    /Linux/i.test(ua) ? 'linux' :
    null
if (p) {
    const el = document.querySelector(`.dl-platform[data-platform="${p}"]`)
    el?.classList.add('dl-platform-active')
}
```

~200 bytes after Vite minification, inlined into HTML.

**Detection notes:**
- iOS reports `Mac` in the UA family (acceptable — iOS users can't install a macOS app anyway, but the highlight at least matches their Apple ecosystem expectation; click leads to the `.dmg` which they likely can't run, but this matches industry-standard behavior)
- Edge/Chrome on Windows reports `Win`
- Linux distros report `Linux`
- Bots / no-match / `userAgentData`-only browsers fall through to no highlight — graceful default

### 4. Performance recovery

Two changes in `src/scripts/`:

#### 4a. `wordmark.ts` — breath loop at 30fps

The current loop calls `requestAnimationFrame(loop)` every frame (~60fps). Add a frame-skip guard:

```ts
const TARGET_FRAME_MS = 33  // ~30fps
let lastFrame = 0

function loop(now: number) {
    if (now - lastFrame < TARGET_FRAME_MS) {
        raf = requestAnimationFrame(loop)
        return
    }
    lastFrame = now
    // ... existing breath + wave-pulse work
    raf = requestAnimationFrame(loop)
}
```

CPU drops ~50%. The 7.5-second sine wave is imperceptibly less smooth at 30fps. CSS variable updates remain the only per-frame cost — no layout reflow, no compositing change.

#### 4b. `shader.ts` — defer until first interaction

Replace the current "start on `window.load`" with "start on first user interaction":

```ts
function startShader() { raf = requestAnimationFrame(tick) }

const triggers: Array<keyof WindowEventMap> = ['mousemove', 'touchstart', 'scroll']
let started = false
function once() {
    if (started) return
    started = true
    triggers.forEach(t => window.removeEventListener(t, once))
    startShader()
}
triggers.forEach(t => window.addEventListener(t, once, { once: true, passive: true }))
```

Lighthouse measures TBT/TTI before any synthetic interaction — so the shader's rAF loop never runs during measurement. Real users start the shader within ~300ms of arrival (first mouse move toward the wordmark).

If `prefers-reduced-motion: reduce` is set, neither change starts the loop, same as today.

#### 4c. Particles — unchanged

The 48-particle Canvas-2D loop already runs cheaply (Lighthouse traces show it under 50ms total). No change needed.

## Files to modify

| File | Change |
|---|---|
| `src/components/Splash.astro` | Replace `<a class="dl-link">` block with `.dl-platforms` markup; add auto-detect `<script>` |
| `src/styles/global.css` | Remove `.dl-link`, add `.letter-3 { margin-left: 0.35em }`, `.dl-platforms`, `.dl-platform*`, `.dl-icon`, `.dl-platform-label`, `.dl-platform-active` |
| `src/scripts/wordmark.ts` | Add 30fps frame-skip guard at start of `loop()` |
| `src/scripts/shader.ts` | Replace `load`-deferred start with first-interaction-deferred start |
| `src/lib/release.ts` (optional) | Add `URLS` export so `Splash.astro` imports the convention from one place (DRY with future RSS/OG endpoints if they ever link to downloads) |

No changes to: pages (`index.astro`, `en/index.astro`, `404.astro`, `en/404.astro`, `changelog.astro`), scripts (`particles.ts`, `keyboard.ts`, `sw.ts`), config, tests, workflows.

## Tests

Existing smoke + a11y tests:
- `tests/smoke.spec.ts:8` asserts `aria-label="ROX.ONE"` on `h1.living-wordmark` and `text=ROXONE` — passes unchanged (CSS gap doesn't affect textContent).
- `tests/smoke.spec.ts:20` asserts `a.dl-link` exists with `text=/скачать/i` — **will fail**. Update to assert `.dl-platform[data-platform="mac"]` exists with `href` matching the DMG URL.
- `tests/smoke.spec.ts:30` (PWA manifest), `:41` (OG image), `:49` (info overlay) — pass unchanged.
- `tests/a11y.spec.ts` — should still pass; the new platform buttons have `aria-label`s and meet the 44×44 tap target floor.

Add one new test:
- `tests/smoke.spec.ts` — three `.dl-platform` buttons render with correct hrefs and aria-labels.

## Acceptance criteria

1. `rox.one/` and `rox.one/en/` render `R O X   O N E` (with visible gap before "O" of "ONE")
2. Three platform buttons replace the single download link, in a horizontal row centered below the wordmark
3. User's OS auto-highlights in a subtle way (color, not size/scale shift)
4. All 6 existing smoke + a11y tests pass; one new smoke test for the buttons passes
5. Lighthouse Perf score ≥ 0.85 (target 0.90; current after regression: 0.87)
6. Visual: matches the user-approved icon-row mockup from brainstorming
7. Production deploy succeeds via existing CI workflow without modification

## Out of scope

- Daylight cycle restoration (user explicitly opted out this round)
- Mobile `DeviceOrientationEvent` tilt
- `/ja/` Japanese locale
- Cmd-K command palette entries for new platforms (could be added later as a one-line follow-up)
- Cloudflare Web Analytics token (still blocked on user-supplied RUM-scoped token)
- Product-side binary builds — separate work in `agisota/rox-one-terminal`

## Risks

| Risk | Mitigation |
|---|---|
| Linux/Windows URLs 404 until product ships binaries | Coordinate timing: ship website same day product publishes a release with new artifacts. Or ship website first, accept temporary 404 (users on those platforms aren't conversion-critical mass yet) |
| iOS UA detection flags as Mac, leading users to a non-runnable `.dmg` | Industry-standard behavior; no good fix without an iOS app. Acceptable. |
| `prefers-reduced-motion` users no longer see WebGL at all (was the case before too) | Document, leave as is — matches reduced-motion intent |
| Bundle slightly larger from inline SVGs (~600 bytes) | Negligible; offset by removing `dl-link` styling |
| OS auto-detect on Tor / privacy-focused browsers may fail | Graceful fallback to no-highlight; functional regression-free |

## Rollback

If anything regresses post-deploy:
- CSS-only revert: keep CSS, restore the old `dl-link` block in `Splash.astro` — fits in a single small commit
- Full revert: `git revert <merge-commit>` — atomic rollback
- CF Pages deploy history retains the previous Astro build; can promote-previous via dashboard for instant rollback

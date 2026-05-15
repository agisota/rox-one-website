import { test, expect } from '@playwright/test'

test.describe('rox.one splash', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
    })

    test('renders the ROXONE wordmark with all 6 letters', async ({ page }) => {
        await expect(page).toHaveTitle(/ROX\.ONE/)

        const wordmark = page.locator('h1.living-wordmark')
        await expect(wordmark).toBeVisible()
        await expect(wordmark).toHaveAttribute('aria-label', 'ROX.ONE')

        const letters = wordmark.locator('span.letter')
        await expect(letters).toHaveCount(6)
        await expect(wordmark).toHaveText('ROXONE')
    })

    test('three platform download buttons render with correct hrefs', async ({ page }) => {
        const mac = page.locator('a.dl-platform[data-platform="mac"]')
        const linux = page.locator('a.dl-platform[data-platform="linux"]')
        const windows = page.locator('a.dl-platform[data-platform="windows"]')

        await expect(mac).toBeVisible()
        await expect(linux).toBeVisible()
        await expect(windows).toBeVisible()

        await expect(mac).toHaveAttribute(
            'href',
            'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-arm64.dmg',
        )
        await expect(linux).toHaveAttribute(
            'href',
            'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-x64.AppImage',
        )
        await expect(windows).toHaveAttribute(
            'href',
            'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-x64.exe',
        )

        await expect(mac).toHaveAttribute('aria-label', /apple silicon/i)
        await expect(linux).toHaveAttribute('aria-label', /linux/i)
        await expect(windows).toHaveAttribute('aria-label', /windows/i)
    })

    test('PWA manifest is linked and reachable', async ({ page, request }) => {
        const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
        expect(manifestHref).toBe('/manifest.webmanifest')
        const res = await request.get(manifestHref!)
        expect(res.status()).toBe(200)
        const manifest = await res.json()
        expect(manifest.name).toBe('ROX.ONE')
        expect(manifest.display).toBe('standalone')
        expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
    })

    test('OG image is generated and exposed', async ({ page, request }) => {
        const og = await page.locator('meta[property="og:image"]').getAttribute('content')
        expect(og).toContain('/og/default.png')
        const res = await request.get('/og/default.png')
        expect(res.status()).toBe(200)
        expect(res.headers()['content-type']).toContain('image/png')
    })

    test("user's platform is auto-highlighted via UA detection", async ({ page }) => {
        // The inline detect script runs synchronously during HTML parse and
        // applies `.dl-platform-active` to the button matching the user's OS.
        // By the time page.goto() resolves on `load`, the class is on the DOM.
        // We don't assert which platform — the runner's UA determines that;
        // contract is "exactly one button is highlighted on a known OS".
        const active = page.locator('a.dl-platform.dl-platform-active')
        await expect(active).toHaveCount(1)
    })

    test('info overlay opens on "i" and closes on Escape', async ({ page }) => {
        // Wait for hydration before exercising keyboard handlers — the SSR
        // HTML loads before React attaches the document-level keydown listener.
        await page.locator('html[data-rox-ready="true"]').waitFor({ state: 'attached' })
        await page.keyboard.press('i')
        const overlay = page.locator('[role="dialog"]')
        await expect(overlay).toBeVisible()
        await expect(overlay).toContainText('ROX.ONE Terminal')
        await page.keyboard.press('Escape')
        await expect(overlay).toBeHidden()
    })
})

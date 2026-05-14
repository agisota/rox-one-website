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

    test('download link points at the latest arm64 DMG', async ({ page }) => {
        const link = page.locator('a.dl-link')
        await expect(link).toBeVisible()
        await expect(link).toHaveAttribute(
            'href',
            'https://github.com/agisota/rox-one-terminal/releases/latest/download/ROX-ONE-arm64.dmg',
        )
        await expect(link).toHaveText(/скачать/i)
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

    test('info overlay opens on "i" and closes on Escape', async ({ page }) => {
        await page.keyboard.press('i')
        const overlay = page.locator('[role="dialog"]')
        await expect(overlay).toBeVisible()
        await expect(overlay).toContainText('ROX.ONE Terminal')
        await page.keyboard.press('Escape')
        await expect(overlay).toBeHidden()
    })
})

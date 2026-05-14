import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('a11y', () => {
    test('homepage has no serious or critical axe violations', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze()

        const blocking = results.violations.filter(
            (v) => v.impact === 'serious' || v.impact === 'critical',
        )
        if (blocking.length) {
            // Surface the failures clearly in CI logs.
            console.error(
                'Axe violations:\n' +
                    blocking
                        .map((v) => `  • [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`)
                        .join('\n'),
            )
        }
        expect(blocking).toEqual([])
    })
})

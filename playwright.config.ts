import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PORT ?? '9000'
// Bind via 127.0.0.1 explicitly; gatsby serve now listens on 0.0.0.0
// (see `serve` script in package.json) so the IPv4 family is reachable.
// localhost on hardened CI runners resolves to ::1 only, which is why
// previous CI runs timed out polling the wrong family.
const BASE = `http://127.0.0.1:${PORT}`

export default defineConfig({
    testDir: './tests',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    use: {
        baseURL: BASE,
        trace: 'on-first-retry',
    },
    webServer: {
        // Reuses existing built `public/` via gatsby serve. CI builds first.
        command: 'pnpm serve --port ' + PORT,
        url: BASE,
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
})

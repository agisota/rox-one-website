import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PORT ?? '9000'
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

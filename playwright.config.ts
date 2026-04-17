import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for the public app booking flow.
 *
 * Prereqs before running:
 *   1. Backend running at http://localhost:8000 with a seeded DB (start.ps1 handles this)
 *   2. Frontend public app running at http://localhost:5173 (start.ps1 handles this)
 *   3. `npm run test:e2e:install` once to install the Chromium binary
 *
 * Tests fall into three categories:
 *   - happy path: end-to-end book + pay with Stripe test card (needs Stripe test keys)
 *   - amount tamper: asserts backend rejects a confirm with a forged amount
 *   - mobile back-button: URL-backed step flow via browser back
 *
 * Tests that need specific seed data (published event slug) read it from process.env.E2E_EVENT_SLUG
 * so CI can pin a stable fixture.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // booking flow is stateful; avoid hammering the same event
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
});

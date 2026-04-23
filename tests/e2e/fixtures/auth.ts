import type { APIRequestContext, Page } from '@playwright/test';

/**
 * Shared auth fixtures for Playwright E2E.
 *
 * CI credentials come from GitHub secrets:
 *   - E2E_TEST_USER_EMAIL
 *   - E2E_TEST_USER_PASSWORD
 *   - E2E_BASE_URL (frontend)
 *   - E2E_API_URL (backend)
 *
 * Local runs fall back to dev defaults.
 */

export const E2E_API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000';
export const E2E_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL ?? 'e2e@example.com';
export const E2E_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? 'e2e-dev-password';

/**
 * Dev-login via backend `/auth/dev-login` (available in Development environment only).
 * Returns cookies attached to the page context after the call.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
    const resp = await page.request.post(`${E2E_API_URL}/auth/dev-login`, {
        data: {
            email: E2E_USER_EMAIL,
            firstName: 'E2E',
            lastName: 'Test',
        },
        headers: { 'X-Portal': 'user' },
    });
    if (!resp.ok()) {
        throw new Error(`dev-login failed: ${resp.status()} ${await resp.text()}`);
    }
}

/**
 * Signin with email+password for environments where dev-login isn't exposed (staging).
 */
export async function signinAsTestUser(request: APIRequestContext): Promise<void> {
    const resp = await request.post(`${E2E_API_URL}/auth/signin`, {
        data: { email: E2E_USER_EMAIL, password: E2E_USER_PASSWORD },
        headers: { 'X-Portal': 'user' },
    });
    if (!resp.ok()) {
        throw new Error(`signin failed: ${resp.status()} ${await resp.text()}`);
    }
}

import type { APIRequestContext, Page } from '@playwright/test';

export const E2E_API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000';
export const E2E_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL ?? 'e2e@example.com';
export const E2E_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? 'e2e-dev-password';

export async function loginAsTestUser(page: Page): Promise<void> {
    const resp = await page.request.post(`${E2E_API_URL}/v1/auth/dev-login`, {
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

export async function signinAsTestUser(request: APIRequestContext): Promise<void> {
    const resp = await request.post(`${E2E_API_URL}/v1/auth/signin`, {
        data: { email: E2E_USER_EMAIL, password: E2E_USER_PASSWORD },
        headers: { 'X-Portal': 'user' },
    });
    if (!resp.ok()) {
        throw new Error(`signin failed: ${resp.status()} ${await resp.text()}`);
    }
}

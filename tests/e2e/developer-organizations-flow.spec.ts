import { expect, test } from '@playwright/test';

/**
 * Developer-portal organization onboarding flow:
 *   1. New Organization modal → create
 *   2. Add a member admin via the Members drawer
 *   3. Generate a Stripe onboarding link via the Stripe modal
 *   4. Copy the link via the in-modal copy button → assert clipboard
 *
 * Prereqs (skipped if missing):
 *   - E2E_DEVELOPER_BASE_URL  — dev portal origin (default http://localhost:5176)
 *   - E2E_DEVELOPER_EMAIL     — seeded developer-role user
 *   - E2E_DEVELOPER_PASSWORD  — optional fallback if dev-login is gated
 *   - E2E_API_URL             — backend origin (default http://localhost:8000)
 *   - E2E_BUSINESS_USER_EMAIL — admin email to attach as the org's first member
 */

const DEV_URL = process.env.E2E_DEVELOPER_BASE_URL ?? 'http://localhost:5176';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000';
const DEV_EMAIL = process.env.E2E_DEVELOPER_EMAIL;
const DEV_PASSWORD = process.env.E2E_DEVELOPER_PASSWORD;
const BU_EMAIL = process.env.E2E_BUSINESS_USER_EMAIL;

const ORG_NAME_PREFIX = 'E2E Org';

test.use({ baseURL: DEV_URL });

test.describe('@developer organizations CRUD + onboarding link', () => {
    test.skip(!DEV_EMAIL || !BU_EMAIL, 'Set E2E_DEVELOPER_EMAIL + E2E_BUSINESS_USER_EMAIL to run');

    test.beforeEach(async ({ context, page }) => {
        // Grant clipboard read/write so the copy-link assertion works in headless.
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        const devLogin = await page.request.post(`${API_URL}/v1/auth/dev-login`, {
            data: { email: DEV_EMAIL, firstName: 'E2E', lastName: 'Dev' },
            headers: { 'X-Portal': 'developer' },
            failOnStatusCode: false,
        });
        if (!devLogin.ok() && DEV_PASSWORD) {
            const signin = await page.request.post(`${API_URL}/v1/admin/auth/signin`, {
                data: { email: DEV_EMAIL, password: DEV_PASSWORD },
                headers: { 'X-Portal': 'developer' },
            });
            if (!signin.ok()) {
                throw new Error(`dev signin failed: ${signin.status()} ${await signin.text()}`);
            }
        }
    });

    test('create org → add member → mint Stripe link → copy', async ({ page }) => {
        const orgName = `${ORG_NAME_PREFIX} ${Date.now()}`;
        await page.goto('/organizations');
        await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible();

        // Step 1 — open New Organization modal
        await page.getByRole('button', { name: /new organization/i }).click();
        // Antd modal renders into a portal — scope to dialog role
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();
        await modal.getByLabel(/name/i).fill(orgName);
        // Country may be a select; choose first US option if present
        const countryControl = modal.getByLabel(/country/i);
        if (await countryControl.count()) {
            await countryControl.click();
            const usOpt = page.getByText(/united states|^US$/i).first();
            if (await usOpt.count()) await usOpt.click();
        }
        await modal.getByRole('button', { name: /create|save|submit/i }).click();

        // Drawer for the new org should open automatically (handleCreated)
        const detailDrawer = page.locator('[role="dialog"]').filter({ hasText: orgName }).first();
        await expect(detailDrawer).toBeVisible({ timeout: 10_000 });

        // Step 2 — Manage members
        await page.getByRole('button', { name: /members|manage members/i }).first().click();
        const membersDrawer = page.locator('[role="dialog"]').filter({ hasText: /members/i }).last();
        await expect(membersDrawer).toBeVisible();
        const addBtn = membersDrawer.getByRole('button', { name: /add member|add admin/i });
        if (await addBtn.count()) {
            await addBtn.click();
            // Add-member modal — pick BU_EMAIL via search
            const addModal = page.locator('[role="dialog"]').last();
            const searchInput = addModal.getByPlaceholder(/search|email/i).first();
            await searchInput.fill(BU_EMAIL!);
            await page.getByText(BU_EMAIL!).first().click();
            await addModal.getByRole('button', { name: /add|save|confirm/i }).click();
        }
        // Close members drawer
        await page.keyboard.press('Escape');

        // Step 3 — Start Stripe onboarding
        await page.getByRole('button', { name: /start stripe|stripe onboarding/i }).first().click();
        const stripeModal = page.locator('[role="dialog"]').filter({ hasText: /stripe/i }).last();
        await expect(stripeModal).toBeVisible();
        await stripeModal.getByRole('button', { name: /generate|create link/i }).click();

        // Wait for the URL to surface (rendered as an input or a link)
        const linkBox = stripeModal.locator('input[readonly], a[href*="connect.stripe.com"]').first();
        await expect(linkBox).toBeVisible({ timeout: 15_000 });

        // Step 4 — Click the copy-to-clipboard button
        await stripeModal.getByRole('button', { name: /copy/i }).first().click();
        const clipboard = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboard).toMatch(/^https?:\/\//);
    });
});

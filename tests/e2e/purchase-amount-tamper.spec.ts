import { expect, test } from '@playwright/test';

/**
 * Confirms the backend rejects a /purchases/{id}/confirm call when the PaymentIntent's
 * amount doesn't match the booking total (the Phase 1 amount-validation fix).
 *
 * This test talks to the API directly — no UI needed. It:
 *   1. Dev-logs in to get a JWT
 *   2. Creates a booking for a seeded event
 *   3. Without actually paying, pokes the confirm endpoint and asserts a 400
 *      with "Payment amount does not match" or "has not succeeded" in the message
 *
 * Requires E2E_EVENT_SLUG for a capacity/Open event (lighter than tables).
 */
const EVENT_SLUG = process.env.E2E_EVENT_SLUG;
const BACKEND = process.env.E2E_API_URL ?? 'http://localhost:8000';

test.describe('@security amount tamper', () => {
  test.skip(!EVENT_SLUG, 'Set E2E_EVENT_SLUG to run');

  test('confirm without completed payment is rejected', async ({ request }) => {
    const login = await request.post(`${BACKEND}/auth/dev-login`, {
      data: { email: process.env.E2E_LOGIN_EMAIL ?? 'user@code829.local', firstName: 'Tamper', lastName: 'Test' },
    });
    expect(login.ok()).toBeTruthy();
    const { token, user } = await login.json();
    expect(user).toBeTruthy();

    const ev = await request.get(`${BACKEND}/events/by-slug/${EVENT_SLUG}`);
    const event = await ev.json();
    test.skip(event.layoutMode !== 'Open', 'This test expects an Open-capacity event');

    const ttRes = await request.get(`${BACKEND}/events/${event.eventId}/ticket-types`);
    const ttBody = ttRes.ok() ? await ttRes.json() : { ticketTypes: [] };
    const ticketTypeId = ttBody.ticketTypes?.[0]?.id;

    const create = await request.post(`${BACKEND}/purchases`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { eventId: event.eventId, seatsReserved: 1, ...(ticketTypeId ? { eventTicketTypeId: ticketTypeId } : {}) },
    });
    expect(create.status(), await create.text()).toBe(201);
    const booking = await create.json();

    // No payment performed — confirm must fail.
    const confirm = await request.post(`${BACKEND}/purchases/${booking.id}/confirm`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(confirm.status()).toBe(400);
    const body = await confirm.json();
    expect(body.message).toMatch(/amount|succeeded|payment/i);

    // Clean up
    await request.post(`${BACKEND}/purchases/${booking.id}/cancel`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });
});

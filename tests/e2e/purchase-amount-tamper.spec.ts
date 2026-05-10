import { expect, test } from '@playwright/test';

const EVENT_SLUG = process.env.E2E_EVENT_SLUG;
const BACKEND = process.env.E2E_API_URL ?? 'http://localhost:8000';

test.describe('@security amount tamper', () => {
  test.skip(!EVENT_SLUG, 'Set E2E_EVENT_SLUG to run');

  test('confirm without completed payment is rejected', async ({ request }) => {
    const login = await request.post(`${BACKEND}/v1/auth/dev-login`, {
      data: { email: process.env.E2E_LOGIN_EMAIL ?? 'user@code829.local', firstName: 'Tamper', lastName: 'Test' },
    });
    expect(login.ok()).toBeTruthy();
    const { token, user } = await login.json();
    expect(user).toBeTruthy();

    const ev = await request.get(`${BACKEND}/v1/events/by-slug/${EVENT_SLUG}`);
    const event = await ev.json();
    test.skip(event.layoutMode !== 'Open', 'This test expects an Open-capacity event');

    const ttRes = await request.get(`${BACKEND}/v1/events/${event.eventId}/ticket-types`);
    const ttBody = ttRes.ok() ? await ttRes.json() : { ticketTypes: [] };
    const ticketTypeId = ttBody.ticketTypes?.[0]?.id;

    const create = await request.post(`${BACKEND}/v1/purchases`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { eventId: event.eventId, seatsReserved: 1, ...(ticketTypeId ? { eventTicketTypeId: ticketTypeId } : {}) },
    });
    expect(create.status(), await create.text()).toBe(201);
    const booking = await create.json();

    const confirm = await request.post(`${BACKEND}/v1/purchases/${booking.id}/confirm`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(confirm.status()).toBe(400);
    const body = await confirm.json();
    expect(body.message).toMatch(/amount|succeeded|payment/i);

    await request.post(`${BACKEND}/v1/purchases/${booking.id}/cancel`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });
});

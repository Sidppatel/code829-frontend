# E2E tests (Playwright)

These specs cover the booking flow end-to-end:

- `booking-happy-path.spec.ts` — grid table booking with Stripe test card (4242 4242 4242 4242)
- `booking-amount-tamper.spec.ts` — confirms /bookings/{id}/confirm rejects when Stripe amount != booking total
- `mobile-back-button.spec.ts` — URL-backed step flow survives browser back/forward + invalid bookingId cleanup

## Running

From `code829-frontend/`:

```
pnpm install
pnpm test:e2e:install   # one-time Chromium install
pnpm test:e2e
```

Prereqs:

- Backend running on `http://localhost:8000` with `STRIPE_SECRET_KEY` set and seed data
- Public app running on `http://localhost:5173` (use `start.ps1` at the repo root)
- `E2E_EVENT_SLUG` env var pointing at a published event in the seeded DB
- `E2E_LOGIN_EMAIL` optional; defaults to `e2e@example.com`

Specs are skipped if `E2E_EVENT_SLUG` is not set so CI can run without fixtures and
opt in when ready.

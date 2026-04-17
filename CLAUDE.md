# Code829 Frontend

## Tech Stack

- **React 19** + **TypeScript** (strict)
- **Vite** (dev server + build)
- **Tailwind CSS** + shadcn/ui components
- **Zustand** for auth state
- **Axios** for HTTP (interceptors in `packages/shared/src/lib/axios.ts`)

## Monorepo Structure (pnpm workspaces)

```
code829-frontend/
├── apps/
│   ├── public/      # Public event listing & booking portal (:5173)
│   ├── admin/       # Admin dashboard & event management (:5174)
│   ├── staff/       # Staff check-in portal (:5175)
│   └── developer/   # Developer API management (:5176)
├── packages/
│   └── shared/      # Auth, types, API clients, hooks, stores
└── tests/           # Playwright E2E
```

## Build & Run

```bash
pnpm install            # Install workspace deps
pnpm -r build           # Build all apps
pnpm dev:public         # Run one app in dev mode
pnpm lint               # Lint all workspaces
pnpm test               # Run Playwright tests
```

## Calculation Rule (architectural)

**No business calculations in React.** All totals, sums, percentages, capacities, and aggregates come from the backend as pre-computed values.

Forbidden in `.tsx` files: arithmetic (`+`, `-`, `*`, `/`, `%`, `.reduce()`) on identifiers whose name ends in `Cents`, `Count`, `Capacity`, `Seats`, `Total`, `Subtotal`, `Fee`, `Rate`, `Percent`, or `Quantity`.

Examples of violations:
- `const total = priceCents * seats;` — ask backend for a quote
- `items.reduce((sum, i) => sum + i.priceCents, 0)` — extend the quote response
- `Math.round((sold / max) * 100)` — backend should return `fillRatePct`

**Allowed:**
- Display formatting: `centsToUSD(value)`, date formatting — these are rendering, not calculation.
- Dollar→cents conversion at form input boundary before the API call: `Math.round(dollars * 100)` — this is input sanitization, not business math.
- Display-only countdowns: `Math.floor(secondsLeft / 60)` for UI timers.

**When adding a new aggregate:**
- Extend the relevant quote endpoint (`POST /bookings/quote`) with new fields.
- Or add a backend stats endpoint (e.g., `GET /admin/events/{id}/stats`) backed by a view/SP.
- Never shortcut by doing the math in the component.

**Authoritative pricing pattern:** `packages/shared/src/hooks/useBookingQuote.ts` calls `POST /bookings/quote` whenever selections change and returns `PricingQuote` with pre-computed `subtotalCents`, `feeCents`, `taxCents`, `totalCents`, `formattedTotal`. Mirror this pattern for any new priced flow.

**PR checklist:** reviewer confirms no new arithmetic on `*Cents`/`*Count`/`*Capacity`/etc. in `.tsx` files, except the narrow allowed exceptions above.

**ESLint rule `event-platform/no-business-calc-in-jsx`** in `tools/eslint-rules/` enforces this on every `pnpm lint` at **Error** severity — new offenses fail lint. Fires on `+` `-` `*` `/` `%` and `.reduce()` when the operand identifier or member-access name ends in a business-domain suffix. `Math.round` / `Math.floor` / `Math.min` / `Math.max` / `Math.abs` are escape hatches (use for input rounding or display timers). Form-boundary conversions: use `centsToDollars(cents)` and `dollarsToCents(dollars)` from `@code829/shared/utils/currency` so the single arithmetic lives in a `.ts` file (not subject to this rule). Per-line escape hatch: `// eslint-disable-next-line event-platform/no-business-calc-in-jsx -- <reason>`.

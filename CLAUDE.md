# Code829 Frontend

## Tech Stack

- **React 19** with TypeScript 5.9
- **Vite 8** for bundling and dev server (port 5173)
- **Ant Design 6** (antd) — primary UI component library
- **Zustand** for state management (persisted auth store)
- **React Router DOM 7** — client-side routing
- **Axios** — HTTP client with interceptors
- **Framer Motion** — animations
- **Stripe.js / React Stripe** — payment UI
- **html5-qrcode** — QR code scanning
- **react-helmet-async** — SEO meta tags
- **dayjs** — date formatting
- **clsx** — conditional classnames

## Build & Run

```bash
npm install                # Install dependencies
npm run dev                # Dev server at http://localhost:5173
npm run build              # TypeScript check + Vite production build
npm run lint               # ESLint
```

## Project Structure

```
src/
├── App.tsx                # Route definitions, lazy loading, layouts
├── main.tsx               # Entry point
├── index.css              # Global styles
├── components/
│   ├── auth/              # ProtectedRoute, auth-related components
│   ├── booking/           # Booking flow components
│   ├── bookings/          # Booking list components
│   ├── checkin/           # Check-in/QR scanning components
│   ├── events/            # Event card, list components
│   ├── layout/            # PublicLayout, AdminLayout, DeveloperLayout
│   └── shared/            # Reusable: ErrorBoundary, LoadingSpinner, EmptyState, PageHeader, etc.
├── hooks/                 # Custom hooks: useAuth, useHoldTimer, useIsMobile, usePagedTable
├── lib/
│   ├── axios.ts           # Axios instance with auth interceptor + error handling
│   └── logger.ts          # Client-side logger
├── pages/                 # Route pages organized by feature
│   ├── admin/             # Admin dashboard, events, bookings, venues, logs, check-in, settings
│   ├── developer/         # Developer dashboard, events, bookings, logs, settings, users
│   ├── auth/              # Magic link verification
│   ├── bookings/          # User booking list
│   ├── event-detail/      # Event detail + booking flow
│   ├── events/            # Public event listing
│   ├── feedback/          # Post-event feedback
│   ├── home/              # Landing page
│   ├── login/             # Login page
│   ├── profile/           # User profile
│   └── tickets/           # Ticket claim, invite
├── services/              # API service layer — one file per domain
│   ├── api.ts             # Barrel export for all services
│   ├── authApi.ts
│   ├── eventsApi.ts
│   ├── bookingsApi.ts
│   ├── adminEventsApi.ts
│   └── ...
├── stores/
│   └── authStore.ts       # Zustand persisted auth state (token + user)
├── types/                 # TypeScript type definitions per domain
│   ├── event.ts, booking.ts, auth.ts, venue.ts, ticket.ts, etc.
│   └── shared.ts          # PagedResponse and common types
└── utils/                 # Utility functions
```

## Architecture

### API Layer
- All HTTP calls go through **domain-specific service files** in `src/services/`
- Each service uses the shared Axios instance from `src/lib/axios.ts`
- Axios interceptor auto-attaches JWT Bearer token from auth store
- 401 responses auto-trigger logout
- Use typed generics on all API calls (e.g., `apiClient.get<PagedResponse<EventSummary>>(...)`)

### State Management
- **Zustand** with `persist` middleware for auth state
- Auth store: `token`, `user`, `setAuth()`, `logout()`
- Persisted to localStorage under key `code829-auth`
- No global state for other domains — use React Query patterns or local state

### Routing
- React Router v7 with lazy-loaded pages (`React.lazy` + `Suspense`)
- Three layout wrappers: `PublicLayout`, `AdminLayout`, `DeveloperLayout`
- `ProtectedRoute` component guards authenticated/role-restricted routes

### Proxy
- Vite dev server proxies `/api` to `http://localhost:8000` (backend), stripping the `/api` prefix

## Conventions

- **TypeScript strict** — no `any` types; define interfaces in `src/types/`
- **Functional components only** — no class components
- **Lazy loading** — all page components are lazy-loaded in App.tsx
- **Ant Design** — use antd components as the default; don't mix in other UI libraries
- **Service layer** — never call Axios directly from components; always go through `src/services/`
- **Fonts**: Inter (body), Playfair Display (headings) — via @fontsource
- **ESLint** config: recommended + React hooks + React refresh rules

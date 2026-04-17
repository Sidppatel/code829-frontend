# Code829 Frontend — React 19 SPA

The client-side single-page application for the Code829 Event Platform. Provides event browsing, table booking, payment checkout, QR-based check-in, and full admin/developer dashboards.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript 5.9 | Type safety |
| Vite 8 | Build tool + dev server |
| Ant Design 6 | UI component library |
| Zustand | State management (persisted auth) |
| React Router DOM 7 | Client-side routing |
| Axios | HTTP client with interceptors |
| Stripe.js + React Stripe | Payment UI |
| Framer Motion | Animations |
| html5-qrcode | QR code scanning |
| react-helmet-async | SEO meta tags |
| dayjs | Date formatting |
| clsx | Conditional classnames |

---

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- Backend API running at `http://localhost:8000` (see [backend README](../code829-backend/README.md))

### Install and Run

```bash
git clone <your-frontend-repo-url> code829-frontend
cd code829-frontend

pnpm install          # Install workspace dependencies
pnpm dev:public       # Start public app at http://localhost:5173
pnpm dev:admin        # Start admin app at http://localhost:5174
pnpm dev:staff        # Start staff app at http://localhost:5175
pnpm dev:developer    # Start developer app at http://localhost:5176
```

### Available Scripts

```bash
pnpm dev:public        # Public app dev server
pnpm dev:admin         # Admin app dev server
pnpm dev:staff         # Staff app dev server
pnpm dev:developer     # Developer app dev server
pnpm build             # Build all apps in the workspace
pnpm build:public      # Build only the public app
pnpm build:admin       # Build only the admin app
pnpm build:staff       # Build only the staff app
pnpm build:developer   # Build only the developer app
pnpm lint              # ESLint check across the workspace
```

---

## Project Structure

```
src/
├── App.tsx                      # Route definitions with lazy loading
├── main.tsx                     # Entry point — React 19, Ant Design theme, providers
├── index.css                    # Global styles, CSS variables, dark/light themes
│
├── components/
│   ├── auth/                    # ProtectedRoute (role-based route guard)
│   ├── booking/                 # Checkout panel, Stripe form, table selection canvas, timer
│   ├── bookings/                # Booking status tag
│   ├── checkin/                 # QR camera scanner
│   ├── events/                  # EventCard, EventFilters
│   ├── layout/                  # PublicLayout, AdminLayout, DeveloperLayout
│   └── shared/                  # Reusable: ErrorBoundary, LoadingSpinner, EmptyState,
│                                  PageHeader, ImageUpload, AvatarUpload, AddressAutocomplete
│
├── context/
│   └── ThemeContext.tsx          # Dark/light mode with localStorage persistence
│
├── hooks/
│   ├── useAuth.ts               # Auth state + role checking
│   ├── useHoldTimer.ts          # Countdown timer for table locks
│   ├── useIsMobile.ts           # Media query hook (768px breakpoint)
│   └── usePagedTable.ts         # Reusable paginated data fetching
│
├── lib/
│   ├── axios.ts                 # Axios instance — JWT interceptor, 401 auto-logout, retry logic
│   └── logger.ts                # Color-coded console logger with timestamps
│
├── pages/
│   ├── home/                    # Landing page with hero section
│   ├── login/                   # Magic link login
│   ├── auth/                    # Magic link verification, onboarding
│   ├── events/                  # Public event listing with search/filters
│   ├── event-detail/            # Event detail + booking flow
│   ├── bookings/                # My bookings, booking detail, ticket management
│   ├── tickets/                 # My tickets, ticket claim page
│   ├── profile/                 # User profile with address + avatar
│   ├── feedback/                # Post-event feedback form
│   ├── admin/                   # Admin panel (events, venues, bookings, layout editor, etc.)
│   └── developer/               # Developer tools (logs, settings, users, platform fees)
│
├── services/                    # API layer — one file per domain
│   ├── api.ts                   # Barrel export
│   ├── authApi.ts               # Magic link, profile, avatar
│   ├── eventsApi.ts             # Public event listing + detail
│   ├── bookingsApi.ts           # Booking CRUD, payment, QR
│   ├── ticketsApi.ts            # Ticket management, invites, claims
│   ├── tableBookingApi.ts       # Table locking/release
│   ├── checkInApi.ts            # QR scan, check-in stats
│   ├── adminEventsApi.ts        # Admin event CRUD
│   ├── adminBookingsApi.ts      # Admin booking management + export
│   ├── adminVenuesApi.ts        # Venue CRUD
│   ├── adminLayoutApi.ts        # Table layout editor API
│   ├── adminDashboardApi.ts     # Dashboard stats
│   ├── developerApi.ts          # Dev tools: logs, settings, users
│   ├── imagesApi.ts             # Image upload, reorder, avatar
│   └── feedbackApi.ts           # Feedback submission
│
├── stores/
│   └── authStore.ts             # Zustand persisted store (token + user in localStorage)
│
├── types/                       # TypeScript interfaces per domain
│   ├── auth.ts                  # UserProfile, AuthResponse, UserRole
│   ├── event.ts                 # EventSummary, EventDetail, EventTableDto
│   ├── booking.ts               # Booking, BookingStatus, PaymentInfo
│   ├── ticket.ts                # BookingTicket, GuestTicket, TicketStatus
│   ├── venue.ts                 # Venue
│   ├── layout.ts                # LayoutTable, EventTableType, TableLock
│   ├── checkin.ts               # ScanResponse, CheckInStats
│   ├── developer.ts             # DashboardStats, DevLogEntry, AppSetting
│   ├── image.ts                 # ImageDto, ImageUploadResponse
│   └── shared.ts                # PagedResponse<T>, ApiError
│
└── utils/
    ├── currency.ts              # centsToUSD(1500) → "$15.00"
    ├── date.ts                  # formatEventDate, formatDateRange (dayjs)
    └── roles.ts                 # hasRole(user, minRole) — role hierarchy check
```

---

## Routing

### Public Routes

| Path | Page | Description |
|---|---|---|
| `/` | HomePage | Landing page with hero and featured events |
| `/events` | EventsPage | Searchable event listing with filters |
| `/events/:slug` | EventDetailPage | Event details + booking flow |
| `/login` | LoginPage | Magic link login form |
| `/auth/verify` | VerifyMagicLinkPage | Token verification callback |
| `/onboarding` | OnboardingPage | First-login profile setup |
| `/tickets/claim` | TicketClaimPage | Guest ticket claim via invite link |
| `/feedback` | FeedbackPage | Post-event feedback submission |

### Authenticated Routes (User+)

| Path | Page | Description |
|---|---|---|
| `/bookings` | MyBookingsPage | User's booking history |
| `/bookings/:id` | BookingDetailPage | Booking details + payment status |
| `/bookings/:id/tickets` | BookingTicketsPage | Manage tickets, invite guests |
| `/tickets` | MyTicketsPage | Guest tickets received via invite |
| `/profile` | ProfilePage | Edit name, phone, address, avatar |

### Admin Routes (Admin role)

| Path | Page | Description |
|---|---|---|
| `/admin` | AdminDashboardPage | KPI dashboard + next event preview |
| `/admin/events` | EventsListPage | Manage events (CRUD, status changes) |
| `/admin/events/new` | EventWizardPage | Create new event (step wizard) |
| `/admin/events/:id/edit` | EventWizardPage | Edit existing event |
| `/admin/events/:id` | EventManagePage | Single event management view |
| `/admin/venues` | VenuesPage | Venue management |
| `/admin/venues/new` | VenueFormPage | Create venue |
| `/admin/venues/:id` | VenueFormPage | Edit venue |
| `/admin/bookings` | AdminBookingsPage | All bookings + CSV/XLSX export |
| `/admin/table-types` | TableTypesPage | Global table template management |
| `/admin/layout/:eventId` | LayoutEditorPage | Visual floor plan editor |
| `/admin/settings` | SettingsPage | Platform settings |
| `/admin/analytics` | AnalyticsPage | Revenue and booking analytics |

### Staff Routes (Staff+)

| Path | Page | Description |
|---|---|---|
| `/staff/checkin/select` | CheckInSelectPage | Select event for check-in |
| `/staff/checkin/:eventId` | CheckInPage | QR scanner + check-in stats |

### Developer Routes (Developer role)

| Path | Page | Description |
|---|---|---|
| `/developer` | DevLogsPage | Application error logs |
| `/developer/email-logs` | EmailLogsPage | Email delivery log |
| `/developer/system-logs` | SystemLogsPage | Background worker logs |
| `/developer/settings` | DevSettingsPage | All app settings (edit mutable) |
| `/developer/users` | DevUsersPage | User management + role changes |
| `/developer/events` | DevEventsPage | Cross-organizer event view + fee config |

---

## Key Features

### Authentication
- Passwordless magic link login (no passwords)
- JWT stored in Zustand (persisted to localStorage)
- Auto-logout on 401 responses
- Role-based route protection with hierarchy

### Booking Flow (Grid Layout)
1. Browse events → select event
2. View table map → click table to lock (10-min hold)
3. Countdown timer shows remaining lock time
4. Enter payment via Stripe Elements
5. Confirm → booking created with QR code

### Booking Flow (Open Layout)
1. Browse events → select event
2. Choose number of seats
3. Enter payment via Stripe Elements
4. Confirm → booking created with QR code

### Ticket System
- Primary booker gets tickets equal to seat count
- Can invite guests via email (magic link claim)
- Each ticket has a unique QR code for check-in
- Guests can view their tickets at `/tickets`

### Admin Dashboard
- Revenue, booking count, event count KPIs
- Upcoming event preview
- Quick links to event management

### Visual Layout Editor
- Drag-and-drop table placement on grid
- Table types with shape, color, capacity, pricing
- Draft save/restore for work-in-progress layouts
- Real-time stats (total capacity, table count)

### Responsive Design
- Mobile-first with breakpoints at 768px (tablet) and 1024px (desktop)
- Mobile: bottom navigation bar, drawer menus
- Desktop: sidebar navigation for admin, top navbar for public

### Theming
- Dark mode (default) and light mode
- Toggle persisted to localStorage
- CSS custom properties for all colors
- Glassmorphism effects, animated gradient orbs

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |
| `VITE_APP_NAME` | `Code829` | Application display name |
| `VITE_DEFAULT_THEME` | `system` | Default theme (dark/light/system) |

### Production

Set in Cloudflare Pages environment variables:

```env
VITE_API_URL=https://code829-backend.onrender.com
VITE_APP_NAME=Code829
VITE_DEFAULT_THEME=system
```

> All `VITE_` prefixed variables are baked into the bundle at build time. Never put secrets in `VITE_` variables.

---

## HTTP Client

The Axios instance (`src/lib/axios.ts`) provides:

- **Auto-auth**: Attaches `Authorization: Bearer <token>` from auth store
- **401 handling**: Auto-logout on unauthorized responses
- **Retry logic**: 2 retries with 2s delay on 503 or network errors (safe methods only)
- **Slow request logging**: Warns on responses > 2000ms
- **Timeout**: 15 seconds

---

## Deployment

### Cloudflare Pages (Production)

The frontend deploys automatically via GitHub Actions on push to `master`.
Each app is deployed to its own Cloudflare Pages project:

| App | Pages project | Production domain |
|---|---|---|
| Public | `code829-public` | `code829.com` |
| Admin | `code829-admin` | `admin.code829.com` |
| Developer | `code829-developer` | `developer.code829.com` |
| Staff | `code829-staff` | `staff.code829.com` |

The workflow:

1. Checks out code
2. Installs workspace dependencies with `pnpm`
3. Builds each app independently
4. Deploys each `apps/*/dist` folder to its matching Cloudflare Pages project via Wrangler

### SPA Routing

For direct URL access to work, ensure `public/_redirects` exists:

```
/*    /index.html    200
```

### Full Deployment Guide

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for complete instructions covering Cloudflare Pages setup, custom domains, and DNS configuration.

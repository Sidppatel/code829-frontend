# Code829 Event Platform: Layout & Design Architecture

This comprehensive guide details the "Human-Centric" design system and the structural architecture of the Code829 platform across all operational modes.

---

## 1. Design System Foundation (The Core)

The entire platform is powered by a centralized HSL-based design system defined in `index.css`. This ensures that a single hue shift can recolor the entire application while maintaining professional contrast ratios.

### Color Tokens (HSL)
- **Primary Hue (`--p-h`)**: `243` (Indigo).
- **Primary Brand**: `hsl(243, 75%, 59%)` – Used for primary interactive elements and focus states.
- **Accent Palette**: 
  - **Gold**: `hsl(45, 93%, 47%)` – Used for warnings and "Held" statuses.
  - **Rose**: `hsl(340, 95%, 65%)` – Used for errors, cancellations, and "Critical" logs.
  - **Green**: `hsl(160, 84%, 39%)` – Used for "Published" states and "Success" health.

### Mode Philosophy
| Feature | Light Mode (Primary) | Dark Mode (Elegant) |
| :--- | :--- | :--- |
| **Background** | `#FDFDFE` (Warm Paper) | `#09090B` (Deep Matte) |
| **Surfaces** | Pure White (`#FFFFFF`) | Elevated Matte (`#121215`) |
| **Borders** | `rgba(0, 0, 0, 0.06)` | `rgba(255, 255, 255, 0.08)` |
| **Shadows** | Layered Premium Shadows | Subtle Glows & Depth |

---

## 2. Operational Modes & Layout Architecture

### A. Admin Mode (`/admin`)
Designed for platform owners and high-level managers.
- **Layout**: `AdminLayout`.
- **Experience**: Premium and spacious. Replaces rigid tables with the **Human Gallery** pattern.
- **Key Screens**:
  - **Dashboard ("Your Space")**: Features the "Next Big Thing" hero section with asymmetric layout grids.
  - **Venues**: A visual catalog of spaces showing instant operational status.

### B. Staff Mode (`/staff`)
Designed for operational efficiency and on-ground execution.
- **Layout**: `AdminLayout` (Shared foundation for consistency).
- **Functional Focus**: **Rapid Data Interaction**.
- **Key Screens**:
  - **Check-In Select**: A simplified list of active events optimized for quick selection.
  - **Check-In Scanning**: High-contrast mobile interface designed for sunlight legibility. Features large buttons and "Scan Ready" states for staff in the field.
- **Mobile Width**: Uses the `mobile-bottom-nav` heavily to ensure one-handed operation during scanning.

### C. Developer Mode (`/developer`)
Designed for system health monitoring and deep-dive technical audit.
- **Layout**: `DeveloperLayout` (Branded as **DevCore**).
- **Experience**: Technical yet refined. Includes specific "Health Nodes" in the header.
- **Key Screens**:
  - **App Logs**: A dense data grid with a "Log Intelligence" modal. Features JetBrains Mono typography for stack traces.
  - **Email Delivery**: A full audit trail of every communication sent to guests.
  - **User Roles**: Direct management of permissions (User, Staff, Admin, Developer).

---

## 3. Responsive Breakpoints & Widths

The platform uses a "Mobile-First" adaptive strategy.

| Screen Size | Breakpoint | Sidebar Behavior | Header Height | Max Content Width |
| :--- | :--- | :--- | :--- | :--- |
| **Phone** | `< 768px` | Hidden (Bottom Nav) | `72px` (Logo/Profile) | `100%` |
| **Tablet** | `768 - 1024px` | Collapsed (`80px`) | `72px` | `100%` |
| **Desktop** | `> 1024px` | Expanded (`260px`*) | `72px` | `1600px` (Centered) |

*\*Developer Sidebar is refined to 260px for better technical label fit.*

### Content Padding
- **Mobile**: `padding: 24px 16px` (tight gutters).
- **Tablet**: `padding: 32px`.
- **Desktop**: `padding: 48px` (breathable gutters).

---

## 4. Premium Component Catalog

### `HumanCard`
- **Chassis**: `14px` radius, `1px` border, multi-variant shadow.
- **Behavior**: Features `hover-lift` (8px vertical float) and `spring-up` entrance animations.
- **Variants**: Includes KPI support, Gallery support, and Inline Action support.

### `HumanSkeleton`
- High-fidelity content placeholders used during data fetching.
- **Shimmer**: `linear-gradient(90deg, transparent, var(--bg-soft), transparent)`.

### `PageHeader`
- **Typography**: Uses `Playfair Display` for 700-weight headings.
- **Layout**: Staggered subtitles and action toolbars.

### `PulseIndicator`
- Used on published events and system health nodes. 
- **Animation**: Breathing radial glow powered by CSS `pulse-ring` keyframes.

---

## 5. Mobile Navigation Pattern
The `mobile-bottom-nav` replaces the sidebar on devices `< 768px`.
- **Admin**: Dashboard, Events, Venues, Bookings, More.
- **Developer**: Logs, Email, System, Settings, Users.
- **Interaction**: Soft active backgrounds (`--primary-soft`) and persistent dot indicators.

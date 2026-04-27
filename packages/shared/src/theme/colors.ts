/**
 * Premium Concierge — centralized color palette.
 *
 * This file is the single source of truth for every color used in the site.
 * CSS files and inline styles are forbidden from containing hex / rgb / hsl
 * literals — they must reference the CSS custom properties this module
 * injects via `applyThemeVars()`, or import the semantic tokens directly.
 *
 * Palette direction from the Code829 design handoff:
 *   warmer aubergine-plum surfaces, cream (not lavender) text, and a violet
 *   brand spectrum. Rose is kept as a named secondary accent so
 *   `var(--accent-rose)` references continue to resolve.
 */

export const palette = {
  // Black surfaces
  bgPage: '#0A0A0A',
  bgSurface: '#141414',
  bgElevated: '#1F1F1F',
  bgNav: '#000000',

  // Silver text spectrum
  textLight: '#F5F5F5',
  textMid: '#C0C0C0',
  textDim: '#8A8A8A',

  // Gold brand spectrum (keys retained as `violet*` for backwards-compat references)
  violet: '#D4AF37',
  violetLight: '#E6C460',
  violetDark: '#9C7E1E',

  // Silver palette (rose keys retained as backwards-compat aliases pointing to silver)
  rose: '#C0C0C0',
  roseLight: '#D4D4D4',
  roseDark: '#8A8A8A',

  silver: '#C0C0C0',
  silverLight: '#D4D4D4',
  silverDark: '#8A8A8A',

  gold: '#D4AF37',
  goldLight: '#E6C460',
  goldDark: '#9C7E1E',
  green: '#10B981',
  redSoft: '#F87171',
} as const;

export const status = {
  info: '#3B82F6',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: palette.green,
  neutral: '#9CA3AF',
} as const;

export const semantic = {
  brand: palette.violet,
  brandHover: palette.violetLight,
  brandLight: palette.violetLight,
  brandDark: palette.violetDark,
  brandOn: '#FFFFFF',

  surface: {
    page: palette.bgPage,
    surface: palette.bgSurface,
    elevated: palette.bgElevated,
    nav: palette.bgNav,
    soft: 'rgba(212, 175, 55, 0.10)',
    muted: 'rgba(212, 175, 55, 0.16)',
    pressed: 'rgba(212, 175, 55, 0.24)',
    overlay: 'rgba(0, 0, 0, 0.82)',
  },

  text: {
    primary: palette.textLight,
    secondary: palette.textMid,
    muted: palette.textDim,
    disabled: 'rgba(245, 245, 245, 0.28)',
    onBrand: '#000000',
  },

  border: {
    default: 'rgba(245, 245, 245, 0.10)',
    subtle: 'rgba(245, 245, 245, 0.06)',
    strong: 'rgba(245, 245, 245, 0.20)',
  },

  shadow: {
    soft: 'rgba(0, 0, 0, 0.20)',
    medium: 'rgba(0, 0, 0, 0.32)',
    strong: 'rgba(0, 0, 0, 0.48)',
  },

  statusBg: {
    info: 'rgba(59, 130, 246, 0.15)',
    warning: 'rgba(245, 158, 11, 0.15)',
    danger: 'rgba(239, 68, 68, 0.15)',
    success: 'rgba(16, 185, 129, 0.15)',
    neutral: 'rgba(156, 163, 175, 0.18)',
  },

  status,
} as const;

export const chartPalette = [
  palette.gold,
  palette.silver,
  palette.goldLight,
  palette.green,
  status.info,
  status.danger,
] as const;

/**
 * Gradient strings — centralized for gradient-heavy CTAs and accents.
 * Use via `var(--gradient-*)` in CSS / inline styles, or import `gradients.*`.
 */
export const gradients = {
  brand: `linear-gradient(135deg, ${palette.violet} 0%, ${palette.violetLight} 100%)`,
  brandVertical: `linear-gradient(180deg, ${palette.violet}, ${palette.violetDark})`,
  brandToGold: `linear-gradient(90deg, ${palette.violet}, ${palette.silver})`,
  brandShimmer: `linear-gradient(120deg, ${palette.violet} 0%, ${palette.violetLight} 50%, ${palette.violet} 100%)`,
  heroFallback: `linear-gradient(135deg, ${palette.violetDark} 0%, ${palette.bgSurface} 100%)`,
  bannerBrand: `linear-gradient(90deg, rgba(212, 175, 55, 0.14), rgba(192, 192, 192, 0.10))`,
  bannerSuccess: `linear-gradient(90deg, rgba(16, 185, 129, 0.10), rgba(16, 185, 129, 0.04))`,
  avatarTint: `linear-gradient(135deg, rgba(212, 175, 55, 0.22), rgba(192, 192, 192, 0.14))`,
} as const;

export const shadows = {
  antToken: `0 4px 16px ${semantic.shadow.strong}`,
  antCard: `0 2px 12px ${semantic.shadow.medium}`,
  card: `0 2px 4px ${semantic.shadow.strong}, 0 8px 24px ${semantic.shadow.medium}, 0 16px 48px ${semantic.shadow.soft}`,
  hover: `0 16px 40px rgba(156, 126, 30, 0.28), 0 4px 12px rgba(0, 0, 0, 0.50)`,
  elevated: `0 4px 20px ${semantic.shadow.strong}`,
  overlay: `0 10px 30px ${semantic.shadow.strong}`,
  soft: `0 1px 2px ${semantic.shadow.soft}`,
  medium: `0 4px 12px ${semantic.shadow.medium}`,
} as const;

/** Original 12-hue swatch set for user-selectable table fill colors. */
export const tablePickerPresets = [
  '#9B6DFF',
  '#6B3FD6',
  '#F46DB2',
  '#C83F87',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#8B5CF6',
] as const;

/**
 * Flat map consumed by `applyThemeVars()` to populate `:root`. Every color
 * reference in CSS or inline styles must resolve to one of these keys via
 * `var(--<key>)`.
 */
export const cssVars: Record<string, string> = {
  primary: semantic.brand,
  'primary-hover': semantic.brandHover,
  'primary-light': semantic.brandLight,
  'primary-dark': semantic.brandDark,
  'primary-soft': semantic.surface.soft,
  'primary-tint': 'rgba(212, 175, 55, 0.04)',
  'primary-muted': semantic.surface.muted,

  'accent-rose': palette.silver,
  'accent-rose-light': palette.silverLight,
  'accent-rose-dark': palette.silverDark,
  'accent-silver': palette.silver,
  'accent-silver-light': palette.silverLight,
  'accent-silver-dark': palette.silverDark,
  'accent-gold': palette.gold,
  'accent-gold-light': palette.goldLight,
  'accent-gold-dark': palette.goldDark,
  'accent-green': palette.green,
  'accent-violet': palette.violet,
  'accent-violet-light': palette.violetLight,
  'accent-violet-dark': palette.violetDark,

  'status-info': status.info,
  'status-warning': status.warning,
  'status-danger': status.danger,
  'status-neutral': status.neutral,
  'status-success': status.success,
  'status-info-bg': semantic.statusBg.info,
  'status-warning-bg': semantic.statusBg.warning,
  'status-danger-bg': semantic.statusBg.danger,
  'status-success-bg': semantic.statusBg.success,
  'status-neutral-bg': semantic.statusBg.neutral,

  'bg-page': semantic.surface.page,
  'bg-surface': semantic.surface.surface,
  'bg-elevated': semantic.surface.elevated,
  'bg-nav': semantic.surface.nav,
  'bg-soft': semantic.surface.soft,
  'bg-muted': semantic.surface.muted,
  'bg-pressed': semantic.surface.pressed,
  'bg-overlay': semantic.surface.overlay,

  border: semantic.border.default,
  'border-strong': semantic.border.strong,
  'border-subtle': semantic.border.subtle,

  'text-primary': semantic.text.primary,
  'text-secondary': semantic.text.secondary,
  'text-muted': semantic.text.muted,
  'text-disabled': semantic.text.disabled,
  'text-on-brand': semantic.text.onBrand,

  'shadow-color-soft': semantic.shadow.soft,
  'shadow-color-medium': semantic.shadow.medium,
  'shadow-color-strong': semantic.shadow.strong,

  'nav-bg': 'rgba(0, 0, 0, 0.85)',
  'nav-border': semantic.border.default,

  'glass-bg': 'rgba(20, 20, 20, 0.75)',
  'glass-border': 'rgba(245, 245, 245, 0.08)',

  'card-shadow':
    '0 2px 4px rgba(0, 0, 0, 0.55), 0 8px 24px rgba(0, 0, 0, 0.40), 0 16px 48px rgba(0, 0, 0, 0.28)',
  'shadow-hover':
    '0 16px 40px rgba(156, 126, 30, 0.28), 0 4px 12px rgba(0, 0, 0, 0.50)',

  'gradient-brand': gradients.brand,
  'gradient-brand-vertical': gradients.brandVertical,
  'gradient-brand-to-gold': gradients.brandToGold,
  'gradient-brand-shimmer': gradients.brandShimmer,
  'gradient-hero-fallback': gradients.heroFallback,
  'gradient-banner-brand': gradients.bannerBrand,
  'gradient-banner-success': gradients.bannerSuccess,
  'gradient-avatar-tint': gradients.avatarTint,
};

const STYLE_ELEMENT_ID = 'app-theme-colors';

function buildRootRule(vars: Record<string, string>): string {
  const lines = Object.entries(vars).map(([key, value]) => `  --${key}: ${value};`);
  return `:root {\n${lines.join('\n')}\n}\n`;
}

/**
 * Synchronously inject the palette into the document as a `<style>` tag.
 *
 * Call this before React renders (top of each app's entry module). The
 * synchronous DOM write guarantees the rule is in the stylesheet before the
 * first paint, so there is no flash of unthemed content.
 *
 * No-op in non-DOM environments (SSR, tests without jsdom).
 */
export function applyThemeVars(vars: Record<string, string> = cssVars): void {
  if (typeof document === 'undefined') return;

  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ELEMENT_ID;
    document.head.prepend(el);
  }
  el.textContent = buildRootRule(vars);
}

applyThemeVars();

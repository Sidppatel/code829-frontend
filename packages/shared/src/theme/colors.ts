/**
 * Premium Concierge — centralized color palette.
 *
 * This file is the single source of truth for every color used in the site.
 * CSS files and inline styles are forbidden from containing hex / rgb / hsl
 * literals — they must reference the CSS custom properties this module
 * injects via `applyThemeVars()`, or import the semantic tokens directly.
 *
 * Palette direction from the Code829 design handoff:
 *   warmer aubergine-plum surfaces, cream (not lavender) text, rose as the
 *   default brand accent. Violet is kept as a named secondary accent so
 *   existing `var(--accent-violet)` references continue to resolve.
 */

export const palette = {
  // Aubergine-plum surfaces (richer than the prior dark plum)
  bgPage: '#0F0B1A',
  bgSurface: '#1B1530',
  bgElevated: '#251B3D',
  bgNav: '#140F25',

  // Cream text (warmer than prior lavender)
  textLight: '#FBF5EA',
  textMid: '#C9BDE0',
  textDim: '#9A8BB8',

  // Rose brand spectrum (new default accent)
  rose: '#F46DB2',
  roseLight: '#FBA6D0',
  roseDark: '#C83F87',

  // Secondary accents — violet retained for backwards-compat references
  violet: '#9B6DFF',
  violetLight: '#B89BFF',
  violetDark: '#6B3FD6',

  gold: '#FBBF24',
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
  brand: palette.rose,
  brandHover: palette.roseLight,
  brandLight: palette.roseLight,
  brandDark: palette.roseDark,
  brandOn: '#FFFFFF',

  surface: {
    page: palette.bgPage,
    surface: palette.bgSurface,
    elevated: palette.bgElevated,
    nav: palette.bgNav,
    soft: 'rgba(244, 109, 178, 0.10)',
    muted: 'rgba(244, 109, 178, 0.16)',
    pressed: 'rgba(244, 109, 178, 0.24)',
    overlay: 'rgba(15, 11, 26, 0.82)',
  },

  text: {
    primary: palette.textLight,
    secondary: palette.textMid,
    muted: palette.textDim,
    disabled: 'rgba(251, 245, 234, 0.28)',
    onBrand: '#FFFFFF',
  },

  border: {
    default: 'rgba(251, 245, 234, 0.10)',
    subtle: 'rgba(251, 245, 234, 0.06)',
    strong: 'rgba(251, 245, 234, 0.20)',
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
  palette.rose,
  palette.violet,
  palette.gold,
  palette.green,
  status.info,
  status.danger,
] as const;

/**
 * Gradient strings — centralized for gradient-heavy CTAs and accents.
 * Use via `var(--gradient-*)` in CSS / inline styles, or import `gradients.*`.
 */
export const gradients = {
  brand: `linear-gradient(135deg, ${palette.rose} 0%, ${palette.roseLight} 100%)`,
  brandVertical: `linear-gradient(180deg, ${palette.rose}, ${palette.roseDark})`,
  brandToGold: `linear-gradient(90deg, ${palette.rose}, ${palette.gold})`,
  brandShimmer: `linear-gradient(120deg, ${palette.rose} 0%, ${palette.roseLight} 50%, ${palette.rose} 100%)`,
  heroFallback: `linear-gradient(135deg, ${palette.roseDark} 0%, ${palette.bgSurface} 100%)`,
  bannerBrand: `linear-gradient(90deg, rgba(244, 109, 178, 0.14), rgba(155, 109, 255, 0.10))`,
  bannerSuccess: `linear-gradient(90deg, rgba(16, 185, 129, 0.10), rgba(16, 185, 129, 0.04))`,
  avatarTint: `linear-gradient(135deg, rgba(244, 109, 178, 0.22), rgba(251, 191, 36, 0.14))`,
} as const;

export const shadows = {
  antToken: `0 4px 16px ${semantic.shadow.strong}`,
  antCard: `0 2px 12px ${semantic.shadow.medium}`,
  card: `0 2px 4px ${semantic.shadow.strong}, 0 8px 24px ${semantic.shadow.medium}, 0 16px 48px ${semantic.shadow.soft}`,
  hover: `0 16px 40px rgba(200, 63, 135, 0.22), 0 4px 12px rgba(15, 11, 26, 0.40)`,
  elevated: `0 4px 20px ${semantic.shadow.strong}`,
  overlay: `0 10px 30px ${semantic.shadow.strong}`,
  soft: `0 1px 2px ${semantic.shadow.soft}`,
  medium: `0 4px 12px ${semantic.shadow.medium}`,
} as const;

/** Original 12-hue swatch set for user-selectable table fill colors. */
export const tablePickerPresets = [
  '#F46DB2',
  '#C83F87',
  '#9B6DFF',
  '#6B3FD6',
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
  'primary-tint': 'rgba(244, 109, 178, 0.04)',
  'primary-muted': semantic.surface.muted,

  'accent-rose': palette.rose,
  'accent-rose-light': palette.roseLight,
  'accent-rose-dark': palette.roseDark,
  'accent-gold': palette.gold,
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

  'nav-bg': 'rgba(20, 15, 37, 0.85)',
  'nav-border': semantic.border.default,

  'glass-bg': 'rgba(27, 21, 48, 0.75)',
  'glass-border': 'rgba(251, 245, 234, 0.08)',

  'card-shadow':
    '0 2px 4px rgba(0, 0, 0, 0.35), 0 8px 24px rgba(0, 0, 0, 0.28), 0 16px 48px rgba(0, 0, 0, 0.18)',
  'shadow-hover':
    '0 16px 40px rgba(200, 63, 135, 0.22), 0 4px 12px rgba(15, 11, 26, 0.40)',

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

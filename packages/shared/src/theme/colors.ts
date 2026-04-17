/**
 * Dark Plum — centralized color palette (restored original brand theme).
 *
 * This file is the single source of truth for every color used in the site.
 * CSS files and inline styles are forbidden from containing hex / rgb / hsl
 * literals — they must reference the CSS custom properties this module
 * injects via `applyThemeVars()`, or import the semantic tokens directly.
 *
 * The palette matches the pre-refactor brand identity: dark plum charcoal
 * surfaces, light lavender text, violet brand spectrum, warm accents. Only
 * the distribution mechanism (`applyThemeVars()` + TS source of truth) is
 * new — the colors themselves are the originals from master.
 */

export const palette = {
  // Dark plum charcoal surfaces
  bgPage: '#120F1A',
  bgSurface: '#1D1727',
  bgElevated: '#251E32',
  bgNav: '#171320',

  // Light lavender text
  textLight: '#F5F2FA',
  textMid: '#B8AFC9',
  textDim: '#948AA8',

  // Violet brand spectrum
  violet: '#7C5CFF',
  violetLight: '#9B82FF',
  violetDark: '#5A3CD6',

  // Accents
  rose: '#F46DB2',
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
  brand: palette.violet,
  brandHover: palette.violetLight,
  brandLight: palette.violetLight,
  brandDark: palette.violetDark,
  brandOn: palette.textLight,

  surface: {
    page: palette.bgPage,
    surface: palette.bgSurface,
    elevated: palette.bgElevated,
    nav: palette.bgNav,
    soft: 'rgba(124, 92, 255, 0.08)',
    muted: 'rgba(124, 92, 255, 0.15)',
    pressed: 'rgba(124, 92, 255, 0.22)',
    overlay: 'rgba(18, 15, 26, 0.82)',
  },

  text: {
    primary: palette.textLight,
    secondary: palette.textMid,
    muted: palette.textDim,
    disabled: 'rgba(255, 255, 255, 0.25)',
    onBrand: palette.textLight,
  },

  border: {
    default: 'rgba(255, 255, 255, 0.10)',
    subtle: 'rgba(255, 255, 255, 0.06)',
    strong: 'rgba(255, 255, 255, 0.18)',
  },

  shadow: {
    soft: 'rgba(0, 0, 0, 0.15)',
    medium: 'rgba(0, 0, 0, 0.25)',
    strong: 'rgba(0, 0, 0, 0.40)',
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
  palette.violet,
  palette.rose,
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
  brand: `linear-gradient(135deg, ${palette.violet} 0%, ${palette.rose} 100%)`,
  brandVertical: `linear-gradient(180deg, ${palette.violet}, ${palette.rose})`,
  brandToGold: `linear-gradient(90deg, ${palette.violet}, ${palette.gold})`,
  heroFallback: `linear-gradient(135deg, ${palette.violetDark} 0%, ${palette.bgSurface} 100%)`,
  bannerBrand: `linear-gradient(90deg, rgba(124, 92, 255, 0.12), rgba(245, 158, 11, 0.08))`,
  bannerSuccess: `linear-gradient(90deg, rgba(16, 185, 129, 0.10), rgba(16, 185, 129, 0.04))`,
  avatarTint: `linear-gradient(135deg, rgba(124, 92, 255, 0.20), rgba(245, 158, 11, 0.15))`,
} as const;

export const shadows = {
  antToken: `0 4px 16px ${semantic.shadow.strong}`,
  antCard: `0 2px 12px ${semantic.shadow.medium}`,
  card: `0 2px 4px ${semantic.shadow.strong}, 0 8px 24px ${semantic.shadow.medium}, 0 16px 48px ${semantic.shadow.soft}`,
  hover: `0 16px 40px rgba(38, 19, 98, 0.18), 0 4px 12px rgba(27, 12, 69, 0.08)`,
  elevated: `0 4px 20px ${semantic.shadow.strong}`,
  overlay: `0 10px 30px ${semantic.shadow.strong}`,
  soft: `0 1px 2px ${semantic.shadow.soft}`,
  medium: `0 4px 12px ${semantic.shadow.medium}`,
} as const;

/** Original 12-hue swatch set for user-selectable table fill colors. */
export const tablePickerPresets = [
  '#7C3AED',
  '#5B21B6',
  '#2563EB',
  '#0EA5E9',
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
  'primary-tint': 'rgba(124, 92, 255, 0.03)',
  'primary-muted': semantic.surface.muted,

  'accent-gold': palette.gold,
  'accent-rose': palette.rose,
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

  'nav-bg': 'rgba(28, 21, 38, 0.82)',
  'nav-border': semantic.border.default,

  'glass-bg': 'rgba(29, 23, 39, 0.75)',
  'glass-border': 'rgba(255, 255, 255, 0.08)',

  'card-shadow':
    '0 2px 4px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.25), 0 16px 48px rgba(0, 0, 0, 0.15)',
  'shadow-hover':
    '0 16px 40px rgba(38, 19, 98, 0.18), 0 4px 12px rgba(27, 12, 69, 0.08)',

  'gradient-brand': gradients.brand,
  'gradient-brand-vertical': gradients.brandVertical,
  'gradient-brand-to-gold': gradients.brandToGold,
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

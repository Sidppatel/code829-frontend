/**
 * Ink Wash — centralized color palette for the whole frontend.
 *
 * This file is the single source of truth for every color used in the site.
 * CSS files and inline styles are forbidden from containing hex / rgb / hsl
 * literals — they must reference the CSS custom properties this module
 * injects via `applyThemeVars()`, or import the semantic tokens directly.
 *
 * Palette reference: Figma "100 Color Combinations" — Combination 8: Ink Wash.
 * Charcoal black, cool gray tones, and soft ivory — simplicity and high contrast.
 * Source swatches: #252525, #545454, #7D7D7D, #CFCFCF (plus implied soft ivory
 * for page surface, matching the description).
 */

export const palette = {
  /** Soft ivory — page surface (description-implied) */
  salt: '#F5F2EC',
  /** Cool light gray — borders, subtle separation */
  lightGray: '#CFCFCF',
  /** Cool mid gray — muted text, strong borders */
  mediumGray: '#7D7D7D',
  /** Charcoal black — brand, primary text */
  pepper: '#252525',
} as const;

/** Fourth Ink Wash source swatch — reserved for text.secondary tier. */
const INK_DARK_GRAY = '#545454';

export const status = {
  info: '#1D4ED8',
  warning: '#B45309',
  danger: '#B91C1C',
  success: '#15803D',
  neutral: palette.mediumGray,
} as const;

export const semantic = {
  brand: palette.pepper,
  brandHover: '#151515',
  brandLight: '#444444',
  brandOn: palette.salt,

  surface: {
    page: palette.salt,
    surface: palette.salt,
    elevated: '#EDEAE3',
    soft: 'rgba(37, 37, 37, 0.04)',
    muted: 'rgba(37, 37, 37, 0.08)',
    pressed: 'rgba(37, 37, 37, 0.14)',
    overlay: 'rgba(37, 37, 37, 0.60)',
  },

  text: {
    primary: palette.pepper,
    secondary: INK_DARK_GRAY,
    muted: palette.mediumGray,
    disabled: palette.lightGray,
    onBrand: palette.salt,
  },

  border: {
    default: palette.lightGray,
    subtle: '#E5E1D9',
    strong: palette.mediumGray,
  },

  shadow: {
    soft: 'rgba(0, 0, 0, 0.04)',
    medium: 'rgba(0, 0, 0, 0.08)',
    strong: 'rgba(0, 0, 0, 0.12)',
  },

  statusBg: {
    info: 'rgba(29, 78, 216, 0.10)',
    warning: 'rgba(180, 83, 9, 0.10)',
    danger: 'rgba(185, 28, 28, 0.10)',
    success: 'rgba(21, 128, 61, 0.10)',
    neutral: 'rgba(125, 125, 125, 0.18)',
  },

  status,
} as const;

export const chartPalette = [
  palette.pepper,
  INK_DARK_GRAY,
  palette.mediumGray,
  status.info,
  status.success,
  status.warning,
] as const;

export const shadows = {
  antToken: `0 1px 2px ${semantic.shadow.soft}, 0 8px 24px ${semantic.shadow.medium}`,
  antCard: `0 1px 3px ${semantic.shadow.soft}`,
  card: `0 1px 2px ${semantic.shadow.soft}, 0 8px 24px ${semantic.shadow.medium}, 0 16px 48px ${semantic.shadow.soft}`,
  hover: `0 16px 40px ${semantic.surface.muted}, 0 4px 12px ${semantic.surface.soft}`,
  elevated: `0 4px 20px ${semantic.shadow.medium}`,
  overlay: `0 10px 30px ${semantic.shadow.strong}`,
  soft: `0 1px 2px ${semantic.shadow.soft}`,
  medium: `0 4px 12px ${semantic.shadow.medium}`,
} as const;

export const tablePickerPresets = [
  palette.pepper,
  INK_DARK_GRAY,
  palette.mediumGray,
  palette.lightGray,
  semantic.brandLight,
  status.info,
  status.success,
  status.warning,
  status.danger,
  '#6D28D9',
  '#0E7490',
  '#B91C7A',
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
  'primary-dark': semantic.brandHover,
  'primary-soft': semantic.surface.soft,
  'primary-tint': semantic.surface.soft,
  'primary-muted': semantic.surface.muted,

  'accent-gold': status.warning,
  'accent-rose': status.danger,
  'accent-green': status.success,
  'accent-violet': semantic.brand,
  'accent-violet-light': semantic.brandLight,
  'accent-violet-dark': semantic.brandHover,

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

  'nav-bg': 'rgba(245, 242, 236, 0.88)',
  'nav-border': semantic.border.default,

  'glass-bg': 'rgba(245, 242, 236, 0.75)',
  'glass-border': semantic.border.default,

  'card-shadow':
    '0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06), 0 16px 48px rgba(0, 0, 0, 0.04)',
  'shadow-hover':
    '0 16px 40px rgba(37, 37, 37, 0.12), 0 4px 12px rgba(37, 37, 37, 0.06)',
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

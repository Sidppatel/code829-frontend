/**
 * Typography tokens — single source of truth for font families, sizes,
 * weights, line heights, and letter spacing. Consumed by `ThemedApp` at
 * boot via `applyTypographyVars()` which injects `--font-*` CSS vars, and
 * importable directly as TS constants.
 */

export const fontFamily = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display: "'Playfair Display', 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
} as const;

export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  md: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '36px',
  '5xl': '48px',
  '6xl': '60px',
  display: 'clamp(36px, 6vw, 72px)',
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const letterSpacing = {
  tighter: '-0.04em',
  tight: '-0.02em',
  normal: '0',
  wide: '0.02em',
  wider: '0.08em',
  widest: '0.2em',
} as const;

export const typographyCssVars: Record<string, string> = {
  '--font-sans': fontFamily.sans,
  '--font-display': fontFamily.display,
  '--font-mono': fontFamily.mono,
  '--font-size-xs': fontSize.xs,
  '--font-size-sm': fontSize.sm,
  '--font-size-base': fontSize.base,
  '--font-size-lg': fontSize.lg,
  '--font-size-xl': fontSize.xl,
  '--font-size-2xl': fontSize['2xl'],
  '--font-size-3xl': fontSize['3xl'],
  '--font-size-4xl': fontSize['4xl'],
  '--font-weight-regular': String(fontWeight.regular),
  '--font-weight-medium': String(fontWeight.medium),
  '--font-weight-semibold': String(fontWeight.semibold),
  '--font-weight-bold': String(fontWeight.bold),
  '--line-height-tight': String(lineHeight.tight),
  '--line-height-snug': String(lineHeight.snug),
  '--line-height-normal': String(lineHeight.normal),
  '--line-height-relaxed': String(lineHeight.relaxed),
  '--letter-spacing-tight': letterSpacing.tight,
  '--letter-spacing-normal': letterSpacing.normal,
  '--letter-spacing-wide': letterSpacing.wide,
  '--letter-spacing-widest': letterSpacing.widest,
};

export function applyTypographyVars(): void {
  if (typeof document === 'undefined') return;
  const id = 'app-theme-typography';
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  const rules = Object.entries(typographyCssVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  el.textContent = `:root {\n${rules}\n}`;
}

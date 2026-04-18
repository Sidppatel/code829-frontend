/** Border radius scale. `radius-full` is kept for backwards-compat with existing CSS. */
export const radii = {
  none: '0',
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  full: '9999px',
} as const;

export const radiiCssVars: Record<string, string> = {
  '--radius-sm': radii.sm,
  '--radius-md': radii.md,
  '--radius-lg': radii.lg,
  '--radius-xl': radii.xl,
  '--radius-2xl': radii['2xl'],
  '--radius-full': radii.full,
};

/** Animation duration & easing tokens. */
export const duration = {
  instant: '0ms',
  fast: '120ms',
  base: '200ms',
  moderate: '320ms',
  slow: '500ms',
} as const;

export const easing = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const motionCssVars: Record<string, string> = {
  '--duration-fast': duration.fast,
  '--duration-base': duration.base,
  '--duration-moderate': duration.moderate,
  '--duration-slow': duration.slow,
  '--ease-standard': easing.standard,
  '--ease-decelerate': easing.decelerate,
  '--ease-spring': easing.spring,
};

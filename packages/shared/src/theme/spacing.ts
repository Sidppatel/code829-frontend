/** Spacing scale — 4px base grid. */
export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

export const spacingCssVars: Record<string, string> = Object.fromEntries(
  Object.entries(spacing).map(([k, v]) => [`--space-${k}`, v]),
);

export function applySpacingVars(): void {
  if (typeof document === 'undefined') return;
  const id = 'app-theme-spacing';
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  const rules = Object.entries(spacingCssVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  el.textContent = `:root {\n${rules}\n}`;
}

applySpacingVars();

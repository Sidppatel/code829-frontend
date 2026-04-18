/**
 * Feature flags read from Vite env. Flip per-app via `.env` / `.env.development`
 * or at runtime via `VITE_*` build vars.
 *
 * Kept deliberately tiny — no remote config, no hooks.
 */

/** When true, apps render the new @code829/ui Navbar/Footer shell. */
export const USE_NEW_SHELL: boolean =
  (import.meta as ImportMeta & { env?: { VITE_USE_NEW_SHELL?: string } }).env
    ?.VITE_USE_NEW_SHELL === 'true';

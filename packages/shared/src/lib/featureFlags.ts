/**
 * Feature flags read from Vite env. Flip per-app via `.env.example`-derived local
 * `.env` (each app's `.env.*` is gitignored) or at runtime via `VITE_*` build vars.
 *
 * Kept deliberately tiny — no remote config, no hooks.
 */

/**
 * When true, apps render the new @code829/ui Navbar/Footer shell. Defaults to `true`
 * so the flag does not require a committed `.env` file — set `VITE_USE_NEW_SHELL=false`
 * explicitly (local-only `.env`) to opt out.
 */
export const USE_NEW_SHELL: boolean =
  (import.meta as ImportMeta & { env?: { VITE_USE_NEW_SHELL?: string } }).env
    ?.VITE_USE_NEW_SHELL !== 'false';

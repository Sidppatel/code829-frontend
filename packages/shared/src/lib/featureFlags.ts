/**
 * Feature flags read from Vite env. Flip per-app via `.env` / `.env.development`
 * or at runtime via `VITE_*` build vars.
 *
 * Kept deliberately tiny — no remote config, no hooks.
 */

type ImportMetaWithEnv = ImportMeta & { env?: Record<string, string | undefined> };

function readEnv(key: string): string | undefined {
  const meta = import.meta as ImportMetaWithEnv;
  return meta.env?.[key];
}

function flag(key: string): boolean {
  return readEnv(key) === 'true';
}

/** When true, apps render the new @code829/ui Navbar/Footer shell. */
export const USE_NEW_SHELL = flag('VITE_USE_NEW_SHELL');

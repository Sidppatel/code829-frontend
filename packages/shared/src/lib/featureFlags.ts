
export const USE_NEW_SHELL: boolean =
  (import.meta as ImportMeta & { env?: { VITE_USE_NEW_SHELL?: string } }).env
    ?.VITE_USE_NEW_SHELL !== 'false';

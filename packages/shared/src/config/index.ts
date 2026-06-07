export const ORGANIZER_NAME =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_ORGANIZER_NAME ||
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_APP_NAME ||
  'Code829';

export const organizerName = ORGANIZER_NAME;

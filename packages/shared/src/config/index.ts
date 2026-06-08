const getProcessEnv = (): Record<string, string> => {
  try {
    const globalObj = globalThis as typeof globalThis & {
      process?: { env?: Record<string, string> };
    };
    return globalObj.process?.env || {};
  } catch {
    return {};
  }
};

const processEnv = getProcessEnv();

export const ORGANIZER_NAME =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_ORGANIZER_NAME ||
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_APP_NAME ||
  processEnv.VITE_ORGANIZER_NAME ||
  processEnv.VITE_APP_NAME ||
  'Code829';

export const organizerName = ORGANIZER_NAME;

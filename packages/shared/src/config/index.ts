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

const isSet = (val: string | undefined): val is string => {
  return typeof val === 'string' && val !== '' && val !== 'undefined';
};

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const ORGANIZER_NAME =
  [
    metaEnv.VITE_ORGANIZER_NAME,
    metaEnv.VITE_APP_NAME,
    processEnv.VITE_ORGANIZER_NAME,
    processEnv.VITE_APP_NAME,
  ].find(isSet) || 'Code829';

export const organizerName = ORGANIZER_NAME;

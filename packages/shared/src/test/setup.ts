import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Suppress known/expected log messages during test execution to keep stderr clean
const originalError = console.error;
const originalWarn = console.warn;

vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  const objArg1 = args[1] as Record<string, unknown> | undefined;
  const objArg0 = args[0] as Record<string, unknown> | undefined;
  
  const getMessage = (obj: unknown) => {
    const o = obj as Record<string, unknown>;
    const err = o?.err as Record<string, unknown>;
    const res = err?.response as Record<string, unknown>;
    const data = res?.data as Record<string, unknown>;
    return data?.message;
  };

  const isCheckoutQuoteError = msg.includes('CheckoutQuoteViewModel') || 
                               (objArg1 && typeof objArg1 === 'object' && String(getMessage(objArg1)).includes('CheckoutQuoteViewModel'));
  const isPurchaseQuoteError = msg.includes('Failed to fetch purchase quote') || 
                               (objArg0 && typeof objArg0 === 'object' && String(getMessage(objArg0)).includes('Purchase quote'));
  const isSessionRefreshError = msg.includes('Session refresh error');
  
  if (isCheckoutQuoteError || isPurchaseQuoteError || isSessionRefreshError) {
    return;
  }
  
  const isNetworkErrorObj = args.length > 1 && typeof objArg1 === 'object' && 
                            objArg1 && 'err' in objArg1 && 
                            (objArg1.err as Error) instanceof Error && 
                            (objArg1.err as Error).message === 'Network error';
  
  if (msg.includes('CheckoutQuoteViewModel') && isNetworkErrorObj) {
    return;
  }
  
  originalError(...args);
});

vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  const str = args.map(arg => {
    if (arg && typeof arg === 'object') {
      try {
        return (arg as Record<string, unknown>).message || JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');

  if (
    str.includes('direction is deprecated') ||
    str.includes("Not implemented: Window's getComputedStyle() method")
  ) {
    return;
  }
  originalWarn(...args);
});

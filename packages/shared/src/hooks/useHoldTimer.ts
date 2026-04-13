import { useState, useEffect } from 'react';

function calcRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

export function useHoldTimer(expiresAt: string | null): number {
  const [secondsLeft, setSecondsLeft] = useState(() => calcRemaining(expiresAt));
  const [prevExpiresAt, setPrevExpiresAt] = useState(expiresAt);

  // Sync state when expiresAt prop changes during render
  if (expiresAt !== prevExpiresAt) {
    setPrevExpiresAt(expiresAt);
    setSecondsLeft(calcRemaining(expiresAt));
  }

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = calcRemaining(expiresAt);
      setSecondsLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return secondsLeft;
}

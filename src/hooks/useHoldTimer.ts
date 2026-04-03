import { useState, useEffect } from 'react';

function calcRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

export function useHoldTimer(expiresAt: string | null): number {
  // Initialize with the real value immediately so the first render is never 0
  const [secondsLeft, setSecondsLeft] = useState(() => calcRemaining(expiresAt));

  useEffect(() => {
    // Sync immediately when expiresAt changes
    setSecondsLeft(calcRemaining(expiresAt));

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

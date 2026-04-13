import { useState, useEffect, type ReactNode } from 'react';
import { ThemeContext, type ThemeMode } from './ThemeContextCore';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('code829-theme') as ThemeMode) || 'dark';
  });

  useEffect(() => {
    document.documentElement.className = mode;
    localStorage.setItem('code829-theme', mode);
  }, [mode]);

  const toggleTheme = () => setMode(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ mode, isDark: mode === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}


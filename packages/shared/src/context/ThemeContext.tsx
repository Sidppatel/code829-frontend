import { type ReactNode } from 'react';
import { ThemeContext } from './ThemeContextCore';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ mode: 'light', isDark: false, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

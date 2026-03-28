import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

function resolveEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

function applyTheme(theme: Theme): void {
  const effective = resolveEffectiveTheme(theme);
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(effective);
}

const storedTheme = (localStorage.getItem('theme') as Theme | null) ?? 'system';
applyTheme(storedTheme);

// Listen for system preference changes when theme is 'system'
const systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const handleSystemChange = (): void => {
    const current = (localStorage.getItem('theme') as Theme | null) ?? 'system';
    if (current === 'system') {
      applyTheme('system');
    }
  };

  systemMediaQuery.addEventListener('change', handleSystemChange);

  return {
    theme: storedTheme,
    setTheme: (theme) => {
      localStorage.setItem('theme', theme);
      applyTheme(theme);
      set({ theme });
    },
  };
});

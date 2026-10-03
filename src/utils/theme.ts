import { ThemeMode } from '../types';

const THEME_STORAGE_KEY = 'titan_theme_mode';

export function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  // Check legacy key if present
  if (localStorage.getItem('titan_dark_mode') === 'true') {
    return 'dark';
  }
  return 'system';
}

export function applyTheme(mode: ThemeMode): boolean {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  
  let isDark = false;
  if (mode === 'dark') {
    isDark = true;
  } else if (mode === 'light') {
    isDark = false;
  } else {
    // System mode: query browser media query
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return isDark;
}

export function subscribeToSystemTheme(callback: (isDark: boolean) => void): () => void {
  if (!window.matchMedia) return () => {};
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
      callback(e.matches);
    }
  };

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}

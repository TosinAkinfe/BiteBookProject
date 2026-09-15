export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "app_theme";

export function getStoredTheme(): ThemeMode {
  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  if (theme === "dark") {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  root.style.colorScheme = theme;
}

export function setTheme(theme: ThemeMode) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

export function initializeTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
}

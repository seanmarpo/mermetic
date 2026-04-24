import type { Theme } from "./types.ts";

const STORAGE_KEY = "mermetic-draft";
const THEME_KEY = "mermetic-theme";

export function saveDraft(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // localStorage may be full or unavailable — silently ignore
  }
}

export function loadDraft(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // silently ignore
  }
}

export function loadTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark") {
      return value;
    }
  } catch {
    // fall through to default
  }
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

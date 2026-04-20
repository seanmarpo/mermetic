import { Theme } from './types.ts'
import { loadTheme, saveTheme } from './storage.ts'

/**
 * Applies the given theme by setting the `data-theme` attribute on the
 * root `<html>` element. This drives all CSS custom-property switches.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * Loads the saved theme preference (falling back to 'dark'),
 * applies it to the document, and returns the active theme.
 */
export function initTheme(): Theme {
  const theme = loadTheme()
  applyTheme(theme)
  return theme
}

/**
 * Toggles between light and dark themes. Persists the new choice to
 * localStorage, applies it to the document, and returns the new theme.
 */
export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === 'dark' ? 'light' : 'dark'
  saveTheme(next)
  applyTheme(next)
  return next
}

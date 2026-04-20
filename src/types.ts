/** Supported export formats */
export type ExportFormat = 'svg' | 'png'

/** App theme */
export type Theme = 'light' | 'dark'

/** Application state stored in localStorage */
export interface AppState {
  code: string
  theme: Theme
}

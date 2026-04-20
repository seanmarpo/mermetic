/**
 * Code editor panel for Mermaid diagram source editing.
 */

export interface EditorInstance {
  getCode: () => string
  setCode: (code: string) => void
  element: HTMLElement
}

export function createEditor(
  _container: HTMLElement,
  onChange: (code: string) => void
): EditorInstance {
  const panel = document.createElement('div')
  panel.className = 'editor-panel'

  const header = document.createElement('div')
  header.className = 'editor-header'

  const headerLabel = document.createElement('span')
  headerLabel.className = 'editor-header-label'
  headerLabel.textContent = 'Editor'
  header.appendChild(headerLabel)

  const textarea = document.createElement('textarea')
  textarea.className = 'editor-textarea'
  textarea.spellcheck = false
  textarea.autocomplete = 'off'
  textarea.setAttribute('autocorrect', 'off')
  textarea.setAttribute('autocapitalize', 'off')
  textarea.placeholder = 'Type your Mermaid diagram here...'
  textarea.setAttribute('aria-label', 'Mermaid diagram code editor')

  // Tab key inserts spaces instead of changing focus
  textarea.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const spaces = '  '

      if (e.shiftKey) {
        // Outdent: remove leading spaces from the current line
        const value = textarea.value
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        const linePrefix = value.substring(lineStart, lineStart + spaces.length)
        if (linePrefix === spaces) {
          textarea.value =
            value.substring(0, lineStart) +
            value.substring(lineStart + spaces.length)
          const newPos = Math.max(lineStart, start - spaces.length)
          textarea.selectionStart = newPos
          textarea.selectionEnd = Math.max(lineStart, end - spaces.length)
          onChange(textarea.value)
        }
      } else {
        // Indent: insert spaces at cursor
        textarea.value =
          textarea.value.substring(0, start) +
          spaces +
          textarea.value.substring(end)
        textarea.selectionStart = start + spaces.length
        textarea.selectionEnd = start + spaces.length
        onChange(textarea.value)
      }
    }
  })

  // Fire onChange on input
  textarea.addEventListener('input', () => {
    onChange(textarea.value)
  })

  panel.appendChild(header)
  panel.appendChild(textarea)

  return {
    getCode: () => textarea.value,
    setCode: (code: string) => {
      textarea.value = code
    },
    element: panel,
  }
}

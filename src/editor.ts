/**
 * Code editor panel for Mermaid diagram source editing.
 */

export interface EditorInstance {
  getCode: () => string;
  setCode: (code: string) => void;
  element: HTMLElement;
}

export function createEditor(
  onChange: (code: string) => void,
  onPaste?: (code: string) => void,
): EditorInstance {
  const panel = document.createElement("div");
  panel.className = "editor-panel";

  const header = document.createElement("div");
  header.className = "editor-header";

  const headerLabel = document.createElement("span");
  headerLabel.className = "editor-header-label";
  headerLabel.textContent = "Editor";
  header.appendChild(headerLabel);

  const textarea = document.createElement("textarea");
  textarea.className = "editor-textarea";
  textarea.spellcheck = false;
  textarea.autocomplete = "off";
  textarea.setAttribute("autocorrect", "off");
  textarea.setAttribute("autocapitalize", "off");
  textarea.placeholder = "Type your Mermaid diagram here...";
  textarea.setAttribute("aria-label", "Mermaid diagram code editor");

  // Tab key inserts spaces instead of changing focus
  textarea.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const spaces = "  ";

      if (start === end && !e.shiftKey) {
        // Single cursor, no selection — insert spaces at cursor using execCommand for undo support
        document.execCommand("insertText", false, spaces);
        onChange(textarea.value);
        return;
      }

      // Find the range of full lines covered by the selection
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = value.indexOf("\n", end - 1);
      const effectiveLineEnd = lineEnd === -1 ? value.length : lineEnd;
      const selectedBlock = value.substring(lineStart, effectiveLineEnd);
      const lines = selectedBlock.split("\n");

      let newBlock: string;
      let newSelStart: number;
      let newSelEnd: number;

      if (e.shiftKey) {
        // Outdent: remove leading spaces from each line
        const outdentedLines = lines.map((line) => {
          if (line.startsWith(spaces)) {
            return line.substring(spaces.length);
          }
          return line;
        });
        newBlock = outdentedLines.join("\n");

        // Adjust selection
        const firstLineRemoved = lines[0].startsWith(spaces)
          ? spaces.length
          : 0;
        newSelStart = Math.max(lineStart, start - firstLineRemoved);
        const totalRemoved = lines.reduce(
          (sum, line) => sum + (line.startsWith(spaces) ? spaces.length : 0),
          0,
        );
        newSelEnd = Math.max(newSelStart, end - totalRemoved);
      } else {
        // Indent: prepend spaces to each line
        newBlock = lines.map((line) => spaces + line).join("\n");
        newSelStart = start + spaces.length;
        newSelEnd = end + lines.length * spaces.length;
      }

      // Select the block of affected lines, then use execCommand to preserve undo history
      textarea.selectionStart = lineStart;
      textarea.selectionEnd = effectiveLineEnd;
      document.execCommand("insertText", false, newBlock);
      // Restore the adjusted selection
      textarea.selectionStart = newSelStart;
      textarea.selectionEnd = newSelEnd;
      onChange(textarea.value);
    }
  });

  // Fire onChange on input, and additionally onPaste for paste events
  textarea.addEventListener("input", (e: Event) => {
    onChange(textarea.value);
    if (
      onPaste &&
      e instanceof InputEvent &&
      e.inputType === "insertFromPaste"
    ) {
      onPaste(textarea.value);
    }
  });

  panel.appendChild(header);
  panel.appendChild(textarea);

  return {
    getCode: () => textarea.value,
    setCode: (code: string) => {
      textarea.value = code;
    },
    element: panel,
  };
}

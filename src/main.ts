import "./style.css";
import { initTheme, toggleTheme } from "./theme.ts";
import { saveDraft, loadDraft } from "./storage.ts";
import { createEditor } from "./editor.ts";
import { createPreview } from "./preview.ts";
import { createToolbar } from "./toolbar.ts";
import { exportSvg, exportPng, downloadBlob } from "./export.ts";
import {
  buildShareUrl,
  loadFromShareUrl,
  clearShareFragment,
} from "./share.ts";
import type { Theme } from "./types.ts";
import mermaid from "mermaid";

const DEFAULT_DIAGRAM = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = undefined;
    }, delay);
  };
}

function getMermaidTheme(appTheme: Theme): string {
  return appTheme === "dark" ? "dark" : "default";
}

function showToast(
  message: string,
  type: "success" | "error" = "success",
): void {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("toast--visible");
  });

  setTimeout(() => {
    toast.classList.remove("toast--visible");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function showShortcutsHelp(): void {
  // Remove existing modal if open
  const existing = document.getElementById("shortcuts-modal");
  if (existing) {
    existing.remove();
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "shortcuts-modal";
  overlay.className = "shortcuts-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "Keyboard shortcuts");

  const dialog = document.createElement("div");
  dialog.className = "shortcuts-dialog";

  const title = document.createElement("h2");
  title.className = "shortcuts-title";
  title.textContent = "Keyboard Shortcuts";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "shortcuts-close-btn";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "\u00d7";

  const header = document.createElement("div");
  header.className = "shortcuts-header";
  header.appendChild(title);
  header.appendChild(closeBtn);

  const shortcuts: Array<[string, string]> = [
    ["Ctrl/\u2318 + N", "New diagram"],
    ["Ctrl/\u2318 + O", "Open file"],
    ["Ctrl/\u2318 + S", "Save as .mmd"],
    ["Tab", "Indent line(s)"],
    ["Shift + Tab", "Outdent line(s)"],
    ["?", "Show this help"],
  ];

  const list = document.createElement("dl");
  list.className = "shortcuts-list";
  for (const [key, desc] of shortcuts) {
    const dt = document.createElement("dt");
    dt.className = "shortcuts-key";
    const kbd = document.createElement("kbd");
    kbd.textContent = key;
    dt.appendChild(kbd);
    const dd = document.createElement("dd");
    dd.className = "shortcuts-desc";
    dd.textContent = desc;
    list.appendChild(dt);
    list.appendChild(dd);
  }

  dialog.appendChild(header);
  dialog.appendChild(list);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Focus the close button for keyboard accessibility
  closeBtn.focus();

  function close(): void {
    overlay.remove();
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

async function main(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) {
    throw new Error("Could not find #app element");
  }

  // --- Initialize theme ---
  let currentTheme = initTheme();

  // --- Initialize Mermaid ---
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: getMermaidTheme(currentTheme) as "default" | "dark",
  });

  // --- Create UI components ---
  const appContent = document.createElement("div");
  appContent.className = "app-content";

  const preview = createPreview();
  const editor = createEditor(
    () => {
      debouncedRender(editor.getCode());
      debouncedSave(editor.getCode());
    },
    (code: string) => {
      // Paste detected — render immediately and fit if successful
      void renderDiagram(code).then(() => {
        if (!hasError) {
          preview.fitToView();
        }
      });
      saveDraft(code);
    },
  );

  // --- Render function ---
  let hasError = false;

  async function renderDiagram(code: string): Promise<void> {
    const result = await preview.render(code);
    hasError = result.error;
    toolbar.updateError(result.error);
  }

  const debouncedRender = debounce((code: string) => {
    void renderDiagram(code);
  }, 300);

  const debouncedSave = debounce((code: string) => {
    saveDraft(code);
  }, 500);

  // --- File input handler ---
  function handleFileOpen(): void {
    const fileInput = toolbar.getFileInput();
    fileInput.value = "";
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        editor.setCode(text);
        void renderDiagram(text);
        saveDraft(text);
        showToast(`Opened ${file.name}`);
      };
      reader.onerror = () => {
        showToast("Failed to read file", "error");
      };
      reader.readAsText(file);
    };
    fileInput.click();
  }

  // --- Reusable handler functions ---
  function handleNew(): void {
    if (
      editor.getCode().trim() !== "" &&
      editor.getCode().trim() !== DEFAULT_DIAGRAM.trim()
    ) {
      if (!confirm("Create a new diagram? Unsaved changes will be lost.")) {
        return;
      }
    }
    editor.setCode(DEFAULT_DIAGRAM);
    void renderDiagram(DEFAULT_DIAGRAM);
    saveDraft(DEFAULT_DIAGRAM);
  }

  function handleSave(): void {
    const blob = new Blob([editor.getCode()], {
      type: "text/plain;charset=utf-8",
    });
    downloadBlob(blob, "diagram.mmd");
    showToast("Saved diagram.mmd");
  }

  // --- Create toolbar ---
  const toolbar = createToolbar({
    onNew: handleNew,
    onOpen: handleFileOpen,
    onSave: handleSave,
    onExportSvg: () => {
      const svg = preview.getSvgElement();
      if (svg) {
        exportSvg(svg);
        showToast("Exported SVG");
      } else {
        showToast("No diagram to export", "error");
      }
    },
    onExportPng: () => {
      const svg = preview.getSvgElement();
      if (svg) {
        void exportPng(svg, {
          scale: 2,
          backgroundColor: currentTheme === "dark" ? "#1a1a2e" : "#ffffff",
        })
          .then(() => {
            showToast("Exported PNG");
          })
          .catch(() => {
            showToast("PNG export failed", "error");
          });
      } else {
        showToast("No diagram to export", "error");
      }
    },
    onCopyCode: () => {
      void navigator.clipboard
        .writeText(editor.getCode())
        .then(() => {
          showToast("Copied to clipboard");
        })
        .catch(() => {
          showToast("Failed to copy", "error");
        });
    },
    onShare: () => {
      const code = editor.getCode().trim();
      if (!code) {
        showToast("Nothing to share yet", "error");
        return;
      }
      void buildShareUrl(code)
        .then((url) => {
          return navigator.clipboard.writeText(url).then(() => {
            // Also put the link in the address bar so the user can see it
            history.replaceState(null, "", url.slice(url.indexOf("#")));
            showToast("Share link copied to clipboard");
          });
        })
        .catch(() => {
          showToast("Failed to create share link", "error");
        });
    },
    onLoadExample: (example) => {
      editor.setCode(example.code);
      void renderDiagram(example.code).then(() => {
        preview.fitToView();
      });
      saveDraft(example.code);
      showToast(`Loaded ${example.label} example`);
    },
    onToggleTheme: () => {
      currentTheme = toggleTheme(currentTheme);
      toolbar.updateThemeIcon(currentTheme);

      // Reinitialize mermaid with the new theme
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: getMermaidTheme(currentTheme) as "default" | "dark",
      });

      // Re-render the current diagram with the new theme
      void renderDiagram(editor.getCode());
    },
    onShowShortcuts: showShortcutsHelp,
  });

  toolbar.updateThemeIcon(currentTheme);

  // --- Panel divider for resizing ---
  const divider = document.createElement("div");
  divider.className = "panel-divider";
  divider.setAttribute("role", "separator");
  divider.setAttribute("aria-label", "Resize panels");

  let isResizing = false;
  let isVerticalLayout = false;
  let startX = 0;
  let startWidth = 0;
  let startY = 0;
  let startHeight = 0;

  divider.addEventListener("mousedown", (e: MouseEvent) => {
    isResizing = true;
    isVerticalLayout = window.innerWidth <= 768;
    if (isVerticalLayout) {
      startY = e.clientY;
      startHeight = editor.element.getBoundingClientRect().height;
      document.body.style.cursor = "row-resize";
    } else {
      startX = e.clientX;
      startWidth = editor.element.getBoundingClientRect().width;
      document.body.style.cursor = "col-resize";
    }
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e: MouseEvent) => {
    if (!isResizing) return;
    if (isVerticalLayout) {
      const dy = e.clientY - startY;
      const newHeight = startHeight + dy;
      const containerHeight = appContent.getBoundingClientRect().height;
      const minHeight = 150;
      const maxHeight = containerHeight - 150 - 6;
      const clampedHeight = Math.min(maxHeight, Math.max(minHeight, newHeight));
      const pct = (clampedHeight / containerHeight) * 100;
      editor.element.style.height = `${pct}%`;
    } else {
      const dx = e.clientX - startX;
      const newWidth = startWidth + dx;
      const containerWidth = appContent.getBoundingClientRect().width;
      const minWidth = 250;
      const maxWidth = containerWidth - 250 - 6; // 6 = divider width
      const clampedWidth = Math.min(maxWidth, Math.max(minWidth, newWidth));
      const pct = (clampedWidth / containerWidth) * 100;
      editor.element.style.width = `${pct}%`;
    }
    updateDividerAriaValue();
  });

  window.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  });

  // Keyboard-based panel resize
  divider.tabIndex = 0;
  divider.setAttribute("aria-orientation", "vertical");
  divider.setAttribute("aria-valuemin", "0");
  divider.setAttribute("aria-valuemax", "100");

  function updateDividerAriaValue(): void {
    const vertical = window.innerWidth <= 768;
    let pct: number;
    if (vertical) {
      const containerHeight = appContent.getBoundingClientRect().height;
      const editorHeight = editor.element.getBoundingClientRect().height;
      pct = Math.round((editorHeight / containerHeight) * 100);
    } else {
      const containerWidth = appContent.getBoundingClientRect().width;
      const editorWidth = editor.element.getBoundingClientRect().width;
      pct = Math.round((editorWidth / containerWidth) * 100);
    }
    divider.setAttribute("aria-valuenow", String(pct));
  }

  divider.addEventListener("keydown", (e: KeyboardEvent) => {
    const vertical = window.innerWidth <= 768;
    if (vertical) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const containerHeight = appContent.getBoundingClientRect().height;
      const currentHeight = editor.element.getBoundingClientRect().height;
      const step = containerHeight * 0.02;
      const delta = e.key === "ArrowDown" ? step : -step;
      const newHeight = currentHeight + delta;
      const minHeight = 150;
      const maxHeight = containerHeight - 150 - 6;
      const clampedHeight = Math.min(maxHeight, Math.max(minHeight, newHeight));
      const pct = (clampedHeight / containerHeight) * 100;
      editor.element.style.height = `${pct}%`;
    } else {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const containerWidth = appContent.getBoundingClientRect().width;
      const currentWidth = editor.element.getBoundingClientRect().width;
      const step = containerWidth * 0.02;
      const delta = e.key === "ArrowRight" ? step : -step;
      const newWidth = currentWidth + delta;
      const minWidth = 250;
      const maxWidth = containerWidth - 250 - 6;
      const clampedWidth = Math.min(maxWidth, Math.max(minWidth, newWidth));
      const pct = (clampedWidth / containerWidth) * 100;
      editor.element.style.width = `${pct}%`;
    }
    updateDividerAriaValue();
  });

  // --- Footer ---
  const footer = document.createElement("footer");
  footer.className = "app-footer";
  footer.setAttribute("role", "contentinfo");

  const footerTagline = document.createElement("span");
  footerTagline.className = "app-footer-tagline";
  footerTagline.textContent = "Mermetic — Hermetically sealed diagramming.";

  const footerLink = document.createElement("a");
  footerLink.className = "app-footer-link";
  footerLink.href = "https://github.com/seanmarpo/mermetic";
  footerLink.target = "_blank";
  footerLink.rel = "noopener noreferrer";
  footerLink.setAttribute("aria-label", "Mermetic on GitHub");
  footerLink.innerHTML = `<svg class="app-footer-github-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>GitHub`;

  footer.appendChild(footerTagline);
  footer.appendChild(footerLink);

  // --- Mount UI ---
  app.appendChild(toolbar.element);
  appContent.appendChild(editor.element);
  appContent.appendChild(divider);
  appContent.appendChild(preview.element);
  app.appendChild(appContent);
  app.appendChild(footer);

  // --- Load initial code (share URL takes priority over saved draft) ---
  let initialCode = DEFAULT_DIAGRAM;
  try {
    const sharedCode = await loadFromShareUrl();
    if (sharedCode) {
      initialCode = sharedCode;
      clearShareFragment();
      showToast("Loaded diagram from share link");
    } else {
      const savedDraft = loadDraft();
      if (savedDraft) {
        initialCode = savedDraft;
      }
    }
  } catch {
    showToast("Invalid share link — loading last draft", "error");
    clearShareFragment();
    const savedDraft = loadDraft();
    if (savedDraft) {
      initialCode = savedDraft;
    }
  }
  editor.setCode(initialCode);
  saveDraft(initialCode);
  await renderDiagram(initialCode);

  // --- Keyboard shortcuts ---
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && e.key === "s") {
      e.preventDefault();
      handleSave();
    }

    if (isMod && e.key === "n") {
      e.preventDefault();
      handleNew();
    }

    if (isMod && e.key === "o") {
      e.preventDefault();
      handleFileOpen();
    }

    // Show keyboard shortcuts help
    if (
      e.key === "?" &&
      !isMod &&
      document.activeElement?.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
      showShortcutsHelp();
    }
  });

  // Suppress the unused variable warning — hasError is read for future use
  void hasError;
}

// --- Bootstrap ---
main().catch((err) => {
  console.error("Mermetic failed to initialize:", err);
});

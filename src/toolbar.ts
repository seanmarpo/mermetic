import type { Theme } from "./types.ts";
import { DIAGRAM_EXAMPLES, type DiagramExample } from "./examples.ts";

interface ToolbarOptions {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onCopyCode: () => void;
  onShare: () => void;
  onLoadExample: (example: DiagramExample) => void;
  onToggleTheme: () => void;
}

interface ToolbarResult {
  element: HTMLElement;
  updateError: (hasError: boolean) => void;
  updateThemeIcon: (theme: Theme) => void;
  getFileInput: () => HTMLInputElement;
}

export function createToolbar(options: ToolbarOptions): ToolbarResult {
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Main toolbar");

  // --- Left section: Logo ---
  const leftSection = document.createElement("div");
  leftSection.className = "toolbar-section toolbar-left";

  const logoIcon = document.createElement("img");
  logoIcon.src = `${import.meta.env.BASE_URL}favicon.svg`;
  logoIcon.alt = "";
  logoIcon.width = 20;
  logoIcon.height = 20;
  logoIcon.className = "toolbar-logo-icon";
  logoIcon.setAttribute("aria-hidden", "true");

  const logo = document.createElement("span");
  logo.className = "toolbar-logo";
  logo.textContent = "Mermetic";

  leftSection.appendChild(logoIcon);
  leftSection.appendChild(logo);

  // --- Middle section: Action buttons ---
  const middleSection = document.createElement("div");
  middleSection.className = "toolbar-section toolbar-middle";

  const fileGroup = document.createElement("div");
  fileGroup.className = "toolbar-group";

  const newBtn = createButton(
    "New",
    "New diagram (Ctrl+N)",
    newIcon(),
    options.onNew,
  );
  const openBtn = createButton(
    "Open",
    "Open file (Ctrl+O)",
    openIcon(),
    options.onOpen,
  );
  const saveBtn = createButton(
    "Save",
    "Save as .mmd (Ctrl+S)",
    saveIcon(),
    options.onSave,
  );

  fileGroup.appendChild(newBtn);
  fileGroup.appendChild(openBtn);
  fileGroup.appendChild(saveBtn);

  // --- Examples dropdown ---
  const examplesWrapper = document.createElement("div");
  examplesWrapper.className = "toolbar-dropdown-wrapper";

  const examplesBtn = document.createElement("button");
  examplesBtn.className = "toolbar-btn";
  examplesBtn.title = "Load an example diagram";
  examplesBtn.setAttribute("aria-label", "Load an example diagram");
  examplesBtn.setAttribute("aria-haspopup", "true");
  examplesBtn.setAttribute("aria-expanded", "false");
  examplesBtn.innerHTML = `${examplesIcon()}<span class="toolbar-btn-label">Examples</span>${chevronDownIcon()}`;

  const examplesMenu = document.createElement("div");
  examplesMenu.className = "toolbar-dropdown-menu";
  examplesMenu.setAttribute("role", "menu");
  examplesMenu.setAttribute("aria-label", "Example diagrams");
  examplesMenu.hidden = true;

  for (const example of DIAGRAM_EXAMPLES) {
    const item = document.createElement("button");
    item.className = "toolbar-dropdown-item";
    item.setAttribute("role", "menuitem");
    item.textContent = example.label;
    item.addEventListener("click", () => {
      options.onLoadExample(example);
      closeExamplesMenu();
    });
    examplesMenu.appendChild(item);
  }

  function closeExamplesMenu(): void {
    examplesMenu.hidden = true;
    examplesBtn.setAttribute("aria-expanded", "false");
  }

  examplesBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !examplesMenu.hidden;
    if (isOpen) {
      closeExamplesMenu();
    } else {
      examplesMenu.hidden = false;
      examplesBtn.setAttribute("aria-expanded", "true");
    }
  });

  // Close on outside click
  document.addEventListener("click", () => {
    closeExamplesMenu();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeExamplesMenu();
    }
  });

  examplesWrapper.appendChild(examplesBtn);
  examplesWrapper.appendChild(examplesMenu);

  fileGroup.appendChild(examplesWrapper);

  const divider = document.createElement("div");
  divider.className = "toolbar-divider";
  divider.setAttribute("role", "separator");
  divider.setAttribute("aria-orientation", "vertical");

  const exportGroup = document.createElement("div");
  exportGroup.className = "toolbar-group";

  const exportSvgBtn = createButton(
    "SVG",
    "Export as SVG",
    exportIcon(),
    options.onExportSvg,
  );
  const exportPngBtn = createButton(
    "PNG",
    "Export as PNG",
    exportIcon(),
    options.onExportPng,
  );
  const copyBtn = createButton(
    "Copy",
    "Copy code to clipboard",
    copyIcon(),
    options.onCopyCode,
  );
  const shareBtn = createButton(
    "Share",
    "Copy a shareable link to clipboard",
    shareIcon(),
    options.onShare,
  );

  exportGroup.appendChild(exportSvgBtn);
  exportGroup.appendChild(exportPngBtn);
  exportGroup.appendChild(copyBtn);
  exportGroup.appendChild(shareBtn);

  middleSection.appendChild(fileGroup);
  middleSection.appendChild(divider);
  middleSection.appendChild(exportGroup);

  // --- Error indicator ---
  const errorIndicator = document.createElement("span");
  errorIndicator.className = "toolbar-error-indicator";
  errorIndicator.setAttribute("aria-label", "Syntax error in diagram");
  errorIndicator.setAttribute("role", "status");
  errorIndicator.title = "Diagram has syntax errors";
  errorIndicator.hidden = true;
  middleSection.appendChild(errorIndicator);

  // --- Right section: Theme toggle ---
  const rightSection = document.createElement("div");
  rightSection.className = "toolbar-section toolbar-right";

  const themeBtn = document.createElement("button");
  themeBtn.className = "toolbar-btn toolbar-btn-icon";
  themeBtn.title = "Toggle theme";
  themeBtn.setAttribute("aria-label", "Toggle theme");
  themeBtn.innerHTML = moonIcon();
  themeBtn.addEventListener("click", options.onToggleTheme);
  rightSection.appendChild(themeBtn);

  // --- Hidden file input ---
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".mmd,.txt,.md";
  fileInput.className = "toolbar-file-input";
  fileInput.setAttribute("aria-hidden", "true");
  fileInput.tabIndex = -1;

  // --- Assemble toolbar ---
  toolbar.appendChild(leftSection);
  toolbar.appendChild(middleSection);
  toolbar.appendChild(rightSection);
  toolbar.appendChild(fileInput);

  return {
    element: toolbar,
    updateError(hasError: boolean) {
      errorIndicator.hidden = !hasError;
    },
    updateThemeIcon(theme: Theme) {
      themeBtn.innerHTML = theme === "dark" ? sunIcon() : moonIcon();
      themeBtn.title = `Switch to ${theme === "dark" ? "light" : "dark"} theme`;
      themeBtn.setAttribute("aria-label", themeBtn.title);
    },
    getFileInput() {
      return fileInput;
    },
  };
}

function createButton(
  label: string,
  title: string,
  iconHtml: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "toolbar-btn";
  btn.title = title;
  btn.setAttribute("aria-label", title);
  btn.innerHTML = `${iconHtml}<span class="toolbar-btn-label">${label}</span>`;
  btn.addEventListener("click", onClick);
  return btn;
}

// --- SVG icon helpers (inline, no external resources) ---

function newIcon(): string {
  return `<svg class="toolbar-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2h5l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
    <polyline points="11 2 11 7 16 7"/>
    <line x1="8" y1="12" x2="14" y2="12"/>
    <line x1="11" y1="9" x2="11" y2="15"/>
  </svg>`;
}

function openIcon(): string {
  return `<svg class="toolbar-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 6a2 2 0 0 1 2-2h3l2 2h5a2 2 0 0 1 2 2v1"/>
    <path d="M2 6v9a2 2 0 0 0 2 2h12l2.5-7H6.5L4 17"/>
  </svg>`;
}

function saveIcon(): string {
  return `<svg class="toolbar-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v7a2 2 0 0 1-2 2z"/>
    <polyline points="12 3 12 8 6 8"/>
    <line x1="7" y1="13" x2="13" y2="13"/>
    <line x1="7" y1="15" x2="11" y2="15"/>
  </svg>`;
}

function exportIcon(): string {
  return `<svg class="toolbar-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 14v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/>
    <polyline points="7 8 10 5 13 8"/>
    <line x1="10" y1="5" x2="10" y2="14"/>
  </svg>`;
}

function copyIcon(): string {
  return `<svg class="toolbar-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="7" y="7" width="10" height="10" rx="1.5"/>
    <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
  </svg>`;
}

function examplesIcon(): string {
  return `<svg class="toolbar-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="6" height="6" rx="1"/>
    <rect x="11" y="3" width="6" height="6" rx="1"/>
    <rect x="3" y="11" width="6" height="6" rx="1"/>
    <rect x="11" y="11" width="6" height="6" rx="1"/>
  </svg>`;
}

function chevronDownIcon(): string {
  return `<svg class="toolbar-icon toolbar-icon-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6 8 10 12 14 8"/>
  </svg>`;
}

function shareIcon(): string {
  return `<svg class="toolbar-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="14" cy="4" r="2.5"/>
    <circle cx="14" cy="16" r="2.5"/>
    <circle cx="5" cy="10" r="2.5"/>
    <line x1="7.2" y1="8.8" x2="11.8" y2="5.2"/>
    <line x1="7.2" y1="11.2" x2="11.8" y2="14.8"/>
  </svg>`;
}

function sunIcon(): string {
  return `<svg class="toolbar-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="10" cy="10" r="3.5"/>
    <line x1="10" y1="2" x2="10" y2="4"/>
    <line x1="10" y1="16" x2="10" y2="18"/>
    <line x1="3" y1="10" x2="5" y2="10"/>
    <line x1="15" y1="10" x2="17" y2="10"/>
    <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>
    <line x1="13.66" y1="13.66" x2="15.07" y2="15.07"/>
    <line x1="4.93" y1="15.07" x2="6.34" y2="13.66"/>
    <line x1="13.66" y1="6.34" x2="15.07" y2="4.93"/>
  </svg>`;
}

function moonIcon(): string {
  return `<svg class="toolbar-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 11.5a7 7 0 1 1-8.5-8.5 5.5 5.5 0 0 0 8.5 8.5z"/>
  </svg>`;
}

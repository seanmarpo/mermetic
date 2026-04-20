# AGENT.md — Guide for AI Agents Working on Mermetic

## Project Overview

**Mermetic — Hermetically sealed diagramming.**

Mermetic is a privacy-first, static, web-based Mermaid diagram editor and viewer. Its core mission is to provide a fast, capable diagramming tool that **never egresses user data outside the browser**. There are no servers, no accounts, no tracking — just a static site that renders Mermaid diagrams locally.

Inspired by [Mermalaid](https://mermalaid.com/editor), but built with a much leaner stack.

---

## Architecture

Mermetic is a **static single-page application (SPA)** with zero server-side dependencies at runtime.

- **Build tool**: Vite
- **Language**: Vanilla TypeScript (strict mode) — no frameworks
- **Diagram rendering**: Mermaid.js
- **UI**: Split-panel layout — toolbar on top, code editor on the left, live diagram preview on the right

The built output is a collection of static files (HTML, CSS, JS, assets) that can be served by any static file server or opened directly in a browser.

---

## Principles & Constraints

### Zero Data Egress

All processing happens **entirely in the browser**. After the initial page load, the application makes **no network requests whatsoever** — no API calls, no CDN fetches, no WebSocket connections, nothing. This is a hard requirement, not a guideline.

### Minimal Dependencies

Only `mermaid` and `vite` (+ its TypeScript tooling) are acceptable heavyweight dependencies. **Do not add npm packages unless absolutely necessary.** If something can be implemented in a few dozen lines of vanilla TypeScript, do that instead of adding a dependency.

### No Frameworks

No React, Vue, Svelte, Angular, Solid, or any other UI framework. Vanilla TypeScript and DOM APIs only. This keeps the bundle small, the architecture simple, and the privacy guarantees easy to audit.

### Security

- Content Security Policy (CSP) headers should be configured to be as restrictive as possible.
- Avoid inline scripts in production builds where feasible.
- No use of `eval()` or `Function()` constructors.
- Sanitize any user-provided content before inserting into the DOM.

### Accessibility

- Use semantic HTML elements (`<main>`, `<nav>`, `<button>`, `<label>`, etc.).
- Provide ARIA labels and roles where semantic HTML is insufficient.
- Ensure full keyboard navigation support.
- Maintain sufficient color contrast in both light and dark themes.

### Privacy

- **No cookies.**
- **No analytics, tracking, or telemetry** of any kind.
- `localStorage` is used only for user preferences (theme) and auto-saving the current draft.
- No third-party scripts or resources loaded at runtime.

---

## Development Commands

```sh
# Set the correct Node.js version (LTS)
nvm use

# Install dependencies
npm install

# Start the development server with hot reload
npm run dev

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## Project Structure

```
mermetic/
├── index.html          # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .nvmrc              # Node.js version (lts/*)
├── AGENT.md            # This file — guidance for AI agents
├── README.md           # Project README
├── public/
│   └── favicon.svg
└── src/
    ├── main.ts          # App entry point, wires everything together
    ├── style.css         # Global styles
    ├── editor.ts         # Code editor panel logic
    ├── preview.ts        # Mermaid preview panel rendering
    ├── toolbar.ts        # Toolbar with action buttons
    ├── theme.ts          # Dark/light theme management
    ├── storage.ts        # localStorage helpers (auto-save, preferences)
    ├── export.ts         # SVG and PNG export utilities
    ├── share.ts          # Share link encoding/decoding (compress + base64url in URL fragment)
    └── types.ts          # Shared TypeScript types and interfaces
```

---

## Code Style

- **Modern ES modules** — use `import`/`export`, no CommonJS.
- **Prefer `const`** over `let`. Never use `var`.
- **Strict TypeScript** — `strict: true` in `tsconfig.json`. No `any` unless absolutely unavoidable (and if so, add a comment explaining why).
- **Small, focused functions** — each function should do one thing well.
- **Semantic HTML** — use the right element for the job (`<button>` for buttons, not `<div onclick>`).
- **Descriptive naming** — variable and function names should be self-documenting.
- Use template literals over string concatenation.
- Handle errors gracefully — don't let exceptions bubble up to the user without a meaningful message.

---

## Testing

Tests should be added as the project matures. The planned test runner is **Vitest** (pairs naturally with the Vite build tool).

- Unit tests for utility modules (`storage.ts`, `export.ts`, `theme.ts`).
- Integration tests for editor ↔ preview rendering pipeline.
- No E2E framework is planned yet — keep it simple.

---

## Common Pitfalls

> **Read this before making changes.**

| ❌ Don't | ✅ Do Instead |
|---|---|
| Add React, Vue, or any UI framework | Use vanilla TypeScript and DOM APIs |
| Add `fetch()`, `XMLHttpRequest`, or any network calls | Keep all processing local to the browser |
| Add analytics, tracking, or telemetry | Respect user privacy unconditionally |
| Use Monaco editor | Use a simple `<textarea>` or lightweight code editor (Monaco is too heavy) |
| Add heavyweight npm packages | Write a small utility function instead |
| Use `eval()` or dynamic code execution | Find a safe alternative |
| Assume a server is available | The built output must work as a fully static site |

**Always verify** that after `npm run build`, the contents of the `dist/` folder work correctly when served by a simple static file server (e.g., `npx serve dist`) with no additional backend.
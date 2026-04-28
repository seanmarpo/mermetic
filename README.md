# Mermetic

**Hermetically sealed diagramming.**

Mermetic is a static, web-based [Mermaid](https://mermaid.js.org/) diagram editor that runs entirely in your browser. No servers, no accounts, no tracking — your data never leaves your machine.

Inspired by [Mermalaid](https://mermalaid.com/editor), but built with a leaner stack and an uncompromising commitment to privacy.

## Features

- 📝 **Live preview** — See your diagram update as you type (with debounced rendering)
- 📤 **Export** — Download diagrams as SVG or PNG
- 🌗 **Dark/light theme** — Toggle between themes to suit your preference
- ⌨️ **Keyboard shortcuts** — Ctrl/Cmd+S to save, and more
- 💾 **Auto-save** — Drafts persist in localStorage automatically
- 📂 **File open/save** — Work with `.mmd` files directly
- 📋 **Copy to clipboard** — One-click code copying
- 🔗 **Share links** — Generate a URL that encodes your diagram entirely in the fragment (`#`), so it never touches a server
- 📱 **Responsive** — Works on mobile and desktop
- 🔍 **Pan & zoom** — Navigate large diagrams in the preview panel

## Privacy Promise

Mermetic makes a simple guarantee: **your data never leaves your browser**.

- Zero network requests after the initial page load
- No analytics, tracking, or telemetry
- No cookies
- No user accounts or cloud storage
- No server-side processing of any kind
- localStorage is used only for your preferences and drafts

The source code is open for anyone to audit and verify these claims.

## Part of [LocalOnlyTools](https://localonly.tools)

Mermetic is part of [LocalOnlyTools](https://localonly.tools), a collection of privacy-first, browser-based utilities that process everything locally on your device. No data ever leaves your browser — just like Mermetic. If you value privacy, check out the other tools in the collection.

## Quick Start

Just visit the hosted URL and start editing. No sign-up, no downloads, no configuration.

## Development

### Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager)
- Node.js LTS (managed via `.nvmrc`)

### Setup

```
nvm use
npm install
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |

### Production Build

The production build outputs a fully static site that can be served from any static file host — no server runtime required.

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [TypeScript](https://www.typescriptlang.org/) | Language (vanilla, no frameworks) |
| [Mermaid.js](https://mermaid.js.org/) | Diagram rendering |

That's it. No React, no Vue, no Angular. Just the browser platform and a few focused libraries.

## License

MIT

## Contributing

Contributions are welcome! Please read [`AGENT.md`](./AGENT.md) for architectural guidelines, principles, and constraints before submitting changes.
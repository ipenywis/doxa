# Doxa

A beautiful, fast documentation template built with **TanStack Start**, **AI Agents**, **React 19**, **Tailwind CSS v4**, **TypeScript**, and **MDX**. Designed for developers, product teams, and technical writers who care about the reading experience as much as the writing.

> **Demo**: [https://docs.doxa.so](https://docs.doxa.so)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Top Language](https://img.shields.io/github/languages/top/ipenywis/doxa-docs-template)](https://github.com/ipenywis/doxa-docs-template)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/ipenywis/doxa-docs-template)
[![Last Commit](https://img.shields.io/github/last-commit/ipenywis/doxa-docs-template)](https://github.com/ipenywis/doxa-docs-template/commits)
[![GitHub issues](https://img.shields.io/github/issues/ipenywis/doxa-docs-template)](https://github.com/ipenywis/doxa-docs-template/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/ipenywis/doxa-docs-template)](https://github.com/ipenywis/doxa-docs-template/pulls)
[![GitHub stars](https://img.shields.io/github/stars/ipenywis/doxa-docs-template)](https://github.com/ipenywis/doxa-docs-template/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ipenywis/doxa-docs-template)](https://github.com/ipenywis/doxa-docs-template/network)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fipenywis%2Fdoxa-docs-template&project-name=doxa-docs-template&repository-name=doxa-docs-template)

---

## Overview

Doxa gives you a production-ready documentation site out of the box — with edge deployment, AI-powered chat, rich MDX components, and a polished reading experience in both light and dark mode.

Built on **TanStack Start** for full-stack React with SSR, deployed to **Cloudflare Workers**, **Vercel** and many more.

---

## Features

### Rich Content Authoring

- **MDX support** — write Markdown with embedded React components
- **Built-in components** — Cards, Notes, Steps, Tabs, FileTree, and more
- **Mermaid.js diagrams** — flowcharts, sequence diagrams, and graphs
- **LaTeX math** — KaTeX-powered mathematical expressions
- **Syntax highlighting** — Prism-based with titles, line highlighting, and copy button
- **Tables** — GitHub-flavored Markdown tables with full styling

### Navigation & Structure

- Multi-level sidebar navigation with collapsible sections
- Auto-generated table of contents
- Content pagination (previous/next)
- Deep nesting support for complex doc structures

### Search & AI

- Fuzzy search with term highlighting
- **AI chat with docs** — ask questions about your documentation using TanStack AI (supports Anthropic, OpenAI, Grok, and OpenRouter)

### Developer Experience

- **TanStack Start** — full-stack React with SSR and file-based routing
- **React 19** with latest features
- **Tailwind CSS v4** for styling
- **TypeScript** strict mode throughout
- **Radix UI** primitives for accessible components
- Light/dark mode with system auto-detection
- SEO-ready with dynamic meta tags, Open Graph, and Twitter Cards
- Google Tag Manager integration

### Deployment

- **Cloudflare Workers** — edge deployment with Wrangler
- **Vercel** — one-click deploy with pre-configured setup
- Optimized for edge runtime performance

---

## Quick Start

### Prerequisites

- Node.js ^24.x
- pnpm ^10.25.0

### Installation

```bash
git clone https://github.com/ipenywis/doxa-docs-template.git
cd doxa-docs-template
pnpm install
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view your docs locally.

### Production Build

```bash
pnpm build
pnpm start
```

---

## Deployment

### Cloudflare Workers (default)

```bash
pnpm deploy
```

### Vercel

```bash
vercel link
vercel env add VITE_SITE_URL
vercel env add AI_API_KEY
pnpm deploy:vercel
```

`VITE_SITE_URL` should match your public docs URL so canonical tags, sitemap, robots, and social metadata use the correct host.

---

## Project Structure

```
src/
  components/
    markdown/     # MDX components (Card, Note, Step, Mermaid, FileTree)
    ui/           # UI components (Tabs, Accordion, Button, Pre)
  contents/
    docs/         # Documentation content (MDX files)
    settings/     # Navigation config (documents.ts)
  lib/
    components.ts # Component registry for MDX
  settings/
    main.ts       # Site settings, SEO, features
agent/
  component-playbook.md  # Component reference for Doxa CLI agent
```

---

## Configuration

All site settings live in `src/settings/main.ts`:

- Site name, URL, description, and keywords
- Company info and branding
- SEO (Open Graph, Twitter Cards)
- Feature toggles (right sidebar, table of contents, AI chat, scroll to top)
- Google Tag Manager

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server (Cloudflare) |
| `pnpm dev:vercel` | Start dev server (Vercel) |
| `pnpm build` | Production build (Cloudflare) |
| `pnpm build:vercel` | Production build (Vercel) |
| `pnpm deploy` | Deploy to Cloudflare Workers |
| `pnpm deploy:vercel` | Deploy to Vercel |
| `pnpm generate:docs` | Regenerate navigation from folder structure |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |

---

## Content Sources

Doxa ships a **unified content access layer** with pluggable adapters. The AI chat agent, route renderers, and AI-native endpoints (`/llms.txt`, `/llms-full.txt`) all read from a single `contentStore` — swap the underlying backend with one env var, no code changes.

Two adapters ship out of the box:

| | `vite` (default) | `github` |
|---|---|---|
| Where content lives | `src/contents/docs/` in this repo | Separate GitHub repo |
| Update model | Redeploy to ship changes | Edits appear within cache TTL |
| Latency | Zero (bundled at build time) | GitHub API + TTL cache |
| External calls | None | GitHub REST API |
| Best for | Site + docs shipped together | Content team edits in GitHub web UI; docs decoupled from site repo |

### Switching to GitHub mode

1. Set `CONTENT_SOURCE=github` in your environment
2. Set the required GitHub env vars:

   ```bash
   DOXA_GITHUB_OWNER=your-org
   DOXA_GITHUB_REPO=your-docs-repo
   DOXA_GITHUB_BRANCH=main                # optional, default "main"
   DOXA_GITHUB_BASE_PATH=src/contents/docs # optional, default "src/contents/docs"
   DOXA_GITHUB_TOKEN=ghp_xxx              # required for private repos
   DOXA_GITHUB_CACHE_TTL=300              # optional, default 300 (seconds)
   ```

3. Redeploy. Content now streams from GitHub — doc edits appear on the site within `DOXA_GITHUB_CACHE_TTL` with no redeploy.

**Creating a GitHub token:**
- Public repos: no token needed (60 req/hr limit; set one anyway for 5,000/hr).
- Private repos: create a fine-grained PAT at [github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta) with **Contents: Read-only** permission on the docs repo.

### Adding a custom adapter (R2, KV, Supabase, Notion, ...)

1. Implement the `ContentAdapter` interface from `src/lib/content/types.ts`.
2. Add a case to the `resolveAdapter()` switch in `src/settings/content.ts`.
3. Add any needed env vars to `.env.example`.

All consumers keep working unchanged — they only see the stable `contentStore` API.

---

## AI-Native Routes

Doxa exposes its documentation in the [llms.txt](https://llmstxt.org/) format so external AI tools (ChatGPT, Claude, Cursor, MCP clients) can discover and cite content directly:

| Route | What |
|---|---|
| `/llms.txt` | Index of all pages with titles, URLs, descriptions |
| `/llms-full.txt` | Full corpus concatenated — paste into an LLM for Q&A |

Both are generated on-demand from `contentStore`, so they stay in sync regardless of adapter.

---

## Contributing

Contributions welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## Credits

Doxa started as a fork of [Rubix Documents](https://github.com/rubixvi/rubix-documents) by [Vincent Vu](https://x.com/rubixvi) / [Rubix Studios](https://rubixstudios.com.au). The original project provided the foundation — we then migrated it to **TanStack Start**, rebuilt the rendering pipeline for edge deployment, added AI-powered chat, introduced new MDX components, and made extensive improvements to performance, lazy loading, and the overall developer experience. All the thanks goes to the Rubix team for their Documents project.

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## Contact

Islem Maboud — [@Ipenywis](https://x.com/Ipenywis)

**Project:** [https://github.com/ipenywis/doxa-docs-template](https://github.com/ipenywis/doxa-docs-template)

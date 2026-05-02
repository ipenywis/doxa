# Doxa — Self-Updating Docs for Modern Codebases

A beautiful, fast documentation template that **writes and updates itself**. Powered by the **Doxa AI agent**, **TanStack Start**, **React 19**, **Tailwind CSS v4**, **TypeScript**, and **MDX** — your docs stay in sync with every PR, with zero human babysitting.


## Overview

Doxa gives you a production-ready documentation site out of the box — with edge deployment, AI-powered chat, rich MDX components, and a polished reading experience.

Built on **TanStack Start** for full-stack React with SSR, deployed to **Cloudflare Workers**, **Vercel** and many more providers coming soon.


## Features

### Docs that auto-updates itself

The **Doxa agent** is built specifically to generate and auto-update documentation for your projects with zero human intervention. Point it at a repo and it ships a complete, structured set of docs — then keeps them in sync as the code evolves.

It integrates natively with this template: generated pages drop straight into `src/contents/docs/`, use the registered MDX components, and respect your section layout and frontmatter conventions out of the box.

Two ways to run it, both keep your docs current on every PR: 

- **Doxa GitHub App (Coming very soon)** — install once on your repo. Every new PR is reviewed by the agent, which opens a follow-up PR (or commit) updating the affected docs pages so `main` is never out of sync with shipped code.
- **Open-source CLI (Coming very soon)** — run the same agent locally or in your own CI. Wire it into a GitHub Action, pre-merge hook, or scheduled job — same behavior, your infrastructure.

The result: docs that stay accurate by default, without anyone remembering to update them.

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
- SEO-ready with dynamic meta tags, Open Graph, Twitter Cards, and generated sitemaps
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
git clone https://github.com/ipenywis/doxa.git
cd doxa
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

## Sitemap Generation

Production builds generate `/sitemap.xml` with TanStack Start. The build seeds sitemap pages from `src/contents/settings/documents.json`; the default Cloudflare build also prerenders those pages and crawls internal links so docs pages stay discoverable.

The sitemap host is inferred from environment variables in this order:

```text
VITE_SITE_URL
DOXA_SITE_URL
SITE_URL
PUBLIC_SITE_URL
PUBLIC_URL
VERCEL_PROJECT_PRODUCTION_URL
VERCEL_URL
VERCEL_BRANCH_URL
CF_PAGES_URL
URL
DEPLOY_URL
DEPLOY_PRIME_URL
```

Set `VITE_SITE_URL=https://docs.example.com` explicitly in production when you want canonical URLs, social metadata, AI-native route URLs, and sitemap entries to share the same public host.

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

| Script               | Description                                 |
| -------------------- | ------------------------------------------- |
| `pnpm dev`           | Start dev server (Cloudflare)               |
| `pnpm dev:vercel`    | Start dev server (Vercel)                   |
| `pnpm build`         | Production build (Cloudflare)               |
| `pnpm build:vercel`  | Production build (Vercel)                   |
| `pnpm deploy`        | Deploy to Cloudflare Workers                |
| `pnpm deploy:vercel` | Deploy to Vercel                            |
| `pnpm generate:docs` | Regenerate navigation from folder structure |
| `pnpm lint`          | Run ESLint                                  |
| `pnpm format`        | Format with Prettier                        |

---

## Content Sources

Doxa ships a **unified content access layer** with pluggable adapters. The AI chat agent, route renderers, and AI-native endpoints (`/llms.txt`, `/llms-full.txt`) all read from a single `contentStore` — swap the underlying backend with one env var, no code changes.

Two adapters ship out of the box:

|                     | `vite` (**default and recommended**)                  | `github`                                                           |
| ------------------- | --------------------------------- | ------------------------------------------------------------------ |
| Where content lives | `src/contents/docs/` in this repo | Separate GitHub repo                                               |
| Update model        | Redeploy to ship changes          | Edits appear within cache TTL                                      |
| Latency             | Zero (bundled at build time)      | GitHub API + TTL cache                                             |
| External calls      | None                              | GitHub REST API                                                    |
| Best for            | Site + docs shipped together      | Content team edits in GitHub web UI; docs decoupled from site repo |

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

| Route            | What                                                 |
| ---------------- | ---------------------------------------------------- |
| `/llms.txt`      | Index of all pages with titles, URLs, descriptions   |
| `/llms-full.txt` | Full corpus concatenated — paste into an LLM for Q&A |

Both are generated on-demand from `contentStore`, so they stay in sync regardless of adapter.

---

## Contributing

Contributions welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## Contact

Islem Maboud — [@Ipenywis](https://x.com/Ipenywis)

Affiliated with [CoderOne](https://youtube.com/@CoderOne)

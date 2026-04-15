# Documents

Documents is a modern documentation starter kit built with **TanStack Start**, **React**, **Tailwind CSS**, **TypeScript**, and **MDX**. Designed for businesses, product teams, and technical writers, it provides a scalable and efficient foundation for documentation websites, product manuals, and knowledge bases.

> **Demo**: [https://rubix-documents.vercel.app](https://rubix-documents.vercel.app)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Top Language](https://img.shields.io/github/languages/top/rubixvi/rubix-documents)](https://github.com/rubixvi/rubix-documents)

![GitHub commit activity](https://img.shields.io/github/commit-activity/m/rubixvi/rubix-documents)
[![Last Commit](https://img.shields.io/github/last-commit/rubixvi/rubix-documents)](https://github.com/rubixvi/rubix-documents/commits)
[![GitHub issues](https://img.shields.io/github/issues/rubixvi/rubix-documents)](https://github.com/rubixvi/rubix-documents/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/rubixvi/rubix-documents)](https://github.com/rubixvi/rubix-documents/pulls)

[![GitHub stars](https://img.shields.io/github/stars/rubixvi/rubix-documents)](https://github.com/rubixvi/rubix-documents/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/rubixvi/rubix-documents)](https://github.com/rubixvi/rubix-documents/network)
[![GitHub repo size](https://img.shields.io/github/repo-size/rubixvi/rubix-documents)](https://github.com/rubixvi/rubix-documents)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fipenywis%2Fdoxa-docs-template&project-name=doxa-docs-template&repository-name=doxa-docs-template)

---

## Overview

Documents enables businesses to deliver clear, structured, and accessible product documentation — with a focus on performance, usability, and maintainability.

Built for technical and content-driven projects, this starter kit supports Markdown (MDX), React components, and a flexible content architecture designed for scale.

---

## Features

### Content Management

- MDX support (Markdown with React components)
- Reusable custom components
- Mermaid.js for diagrams and flowcharts
- Tables and LaTeX math support

### Navigation & Structure

- Multi-level navigation
- Auto-generated table of contents
- Content pagination
- Code snippet switcher with copy functionality

### Development Experience

- Syntax highlighting with theme support
- Enhanced code blocks with titles and line highlighting
- Built-in light/dark mode with auto-detection
- SEO-ready with dynamic meta tags

### Search & Future Enhancements

- Fuzzy search with term highlighting
- Planned: AI-powered knowledgebase tools

---

## Quick Start

### Installation

```bash
git clone https://github.com/ipenywis/doxa-docs-template.git
cd doxa-docs-template
pnpm install
pnpm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view your project locally.

**For production:**

```bash
pnpm run build
pnpm run start
```

Deploy to Cloudflare Workers or Vercel for automated builds and hosting.

## Deployment

### Cloudflare Workers

```bash
pnpm run deploy
```

### Vercel

```bash
vercel link
vercel env add VITE_SITE_URL
vercel env add AI_API_KEY
pnpm run deploy:vercel
```

`VITE_SITE_URL` should match the public docs URL so canonical tags, sitemap entries, robots, and social metadata use the correct host.

### Optional: Install ripgrep for faster search

The documentation agent's search tool uses [ripgrep](https://github.com/BurntSushi/ripgrep) when available, falling back to standard `grep` otherwise. For significantly faster doc searches, install ripgrep:

**macOS:**

```bash
brew install ripgrep
```

**Ubuntu / Debian:**

```bash
sudo apt-get install ripgrep
```

**Other platforms:**

See the [ripgrep installation guide](https://github.com/BurntSushi/ripgrep#installation).

---

## Usage

Documents is designed to support:

- Product documentation
- Technical manuals
- Internal guides
- Business knowledge bases

---

## Screenshots

![Main Screen](./public/screens/screen-1.png)
_Main Screen_

![Document Screen](./public/screens/screen-2.png)
_Document Screen_

![Document Footer](./public/screens/screen-3.png)
_Document Footer_

![Document Search](./public/screens/screen-4.png)
_Document Search_

![Main Dark Screen](./public/screens/screen-5.png)
_Main Dark Mode Screen_

![Document Dark Screen](./public/screens/screen-6.png)
_Document Dark Mode Screen_

---

## Contributing

We welcome contributions to improve this project.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## Contact

For support or inquiries:

Vincent Vu — [@rubixvi](https://x.com/rubixvi)

Rubix Studios — [https://rubixstudios.com.au](https://rubixstudios.com.au)

**Project:** [https://github.com/rubixvi/rubix-documents](https://github.com/rubixvi/rubix-documents)

# Doxa Docs Template

A documentation website template built with TanStack React Router, Tailwind CSS, and MDX.

## Build & Dev

- `pnpm install` — install dependencies
- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm generate:docs` — regenerate `src/contents/settings/documents.ts` from folder structure

## Architecture

- MDX components: `src/components/markdown/` (Card, Note, Step, Mermaid, FileTree)
- UI components: `src/components/ui/` (Tabs, Accordion, Button, etc.)
- Component registry: `src/lib/components.ts` — this is where all MDX-available components are registered
- Documentation content: `src/contents/docs/` — MDX files organized in folders
- Navigation config: `src/contents/settings/documents.ts`
- Site settings: `src/settings/main.ts`

## IMPORTANT: Keep the Component Playbook in Sync

The file `agent/component-playbook.md` is the authoritative reference that the Doxa CLI agent reads at runtime to understand what MDX components are available, how to use them, and when to apply them for documentation generation.

**YOU MUST update `agent/component-playbook.md` whenever you:**

- Add a new component to `src/components/markdown/` or register one in `src/lib/components.ts`
- Remove or rename an existing component
- Change a component's props, variants, or behavior
- Add or modify example docs in `src/contents/docs/markdown/`

**What to update in the playbook:**

1. **Component Catalog section** — add/update the component entry with its name, all props, variants, and a usage example
2. **Usage Patterns by Doc Type section** — add guidance for when the new component should be used on each page type
3. **Anti-patterns section** — add any misuse patterns to avoid
4. **Composition Rules section** — document how the component interacts with others

If the playbook falls out of sync, the CLI agent will generate documentation using outdated or missing component knowledge, producing lower quality output.

## Code Style

- TypeScript strict mode
- Tailwind CSS for styling
- Radix UI primitives for accessible UI components
- Lucide React for icons (icon map in `src/settings/icons.ts`)
- All MDX pages use YAML frontmatter with unquoted values

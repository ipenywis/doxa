# Doxa Component Playbook

This is the authoritative reference for MDX components, Markdown features, and authoring patterns available in the Doxa documentation template. The documentation generation agent reads this file at runtime, so keep it aligned with `src/lib/components.ts` and the example docs under `src/contents/docs`.

**Update this file whenever components, props, examples, or authoring guidance changes.**

---

## Frontmatter

Every page must start with YAML frontmatter:

```markdown
---
title: Page Title
description: A specific one-sentence page description.
keywords: ["keyword", "another keyword"]
---
```

- `title` is required and rendered as the page h1. Do not repeat it in the body.
- `description` is required and feeds metadata, search, and page subtitles.
- `keywords` should include user search terms and feature synonyms.
- Use h2-h4 headings in body content.
- Each page must be an `index.mdx` file inside a folder that becomes the route slug.

## Current Example Docs Structure

The template's example docs are organized as a self-demo of Doxa:

- **Start Here**: Overview, Quickstart, Project Structure, Configuration
- **Authoring**: Markdown, MDX Components, Code Blocks, Diagrams And Math
- **AI & Search**: Chat With Docs, Agent Tools, llms.txt, Search
- **Operations**: Content Sources, Navigation, Customization, Deployment

Use this structure as the preferred model when generating or expanding starter documentation.

## Component Catalog

### Cards (`CardGrid` + `Card`)

Use cards for navigation, related pages, feature groups, and external resources.

```jsx
<CardGrid>
  <Card
    subtitle="Start"
    title="Quickstart"
    description="Install dependencies and run the docs site locally."
    href="/docs/quickstart"
  />
  <Card
    title="Search"
    href="/docs/search"
    icon="alignJustify"
    variant="small"
    description="Understand generated search data."
  />
  <Card
    title="Repository"
    href="https://github.com/ipenywis/doxa-docs-template"
    external={true}
  />
</CardGrid>
```

**Props**: `title` (string), `subtitle?` (string), `description?` (string), `href?` (string), `icon?` (`"alignJustify"` or another key registered in `src/settings/icons.ts`), `image?` (string), `variant?` (`"normal"` | `"small"` | `"image"`), `external?` (boolean), `className?` (string)

### Notes (`Note`)

Use notes for information readers should not miss.

```jsx
<Note title="Search index">
  Run `pnpm generate-content-json` after editing docs.
</Note>

<Note title="Success" type="success">
  The local docs site is running.
</Note>

<Note title="Warning" type="warning">
  Set `AI_API_KEY` before enabling Chat with Docs in production.
</Note>

<Note title="Danger" type="danger">
  Do not expose provider secrets as public Vite environment variables.
</Note>
```

**Props**: `title?` (string), `type?` (`"note"` | `"success"` | `"warning"` | `"danger"`)

### Steps (`Step` + `StepItem`)

Use steps for sequential workflows.

```jsx
<Step>
  <StepItem title="Install dependencies">
    ```bash
    pnpm install
    ```
  </StepItem>

  <StepItem title="Start the dev server">
    ```bash
    pnpm dev
    ```
  </StepItem>
</Step>
```

**StepItem props**: `title?` (string)

Leave a blank line before and after code fences inside `StepItem`.

### Tabs (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`)

Use tabs for mutually exclusive alternatives such as providers, package managers, or deployment targets.

```jsx
<Tabs defaultValue="cloudflare" className="pt-5 pb-1">
  <TabsList>
    <TabsTrigger value="cloudflare">Cloudflare</TabsTrigger>
    <TabsTrigger value="vercel">Vercel</TabsTrigger>
  </TabsList>
  <TabsContent value="cloudflare">
    ```bash
    pnpm build:cloudflare
    ```
  </TabsContent>
  <TabsContent value="vercel">
    ```bash
    pnpm build:vercel
    ```
  </TabsContent>
</Tabs>
```

**Tabs props**: `defaultValue` (string matching a trigger), `className?` (string)

### Mermaid (`Mermaid`)

Use Mermaid for architecture, request flow, sequence, and relationship diagrams.

```jsx
<Mermaid
  chart={`graph TD;
    MDX[MDX pages] --> Store[contentStore];
    Store --> Routes[Docs routes];
    Store --> Agent[AI agent];
    Store --> Llms[llms.txt exports];`}
/>
```

**Props**: `chart` (Mermaid syntax string), `className?` (string)

### File Tree (`FileTree`, `Folder`, `File`)

Use file trees for physical structure and project layout.

```jsx
<FileTree>
  <Folder name="src" label="Source" defaultOpen>
    <Folder name="contents" label="Docs content">
      <File name="docs/overview/index.mdx" label="Overview page" />
    </Folder>
  </Folder>
</FileTree>
```

**Folder props**: `name` (string), `label?`, `open?` (boolean), `defaultOpen?` (boolean)  
**File props**: `name` (string), `label?`

### Standard Markdown Features

Doxa supports:

- GitHub-flavored tables
- Checklists
- Blockquotes
- Images with optional titles
- Inline and fenced code
- Code copy buttons
- Syntax highlighting
- Line numbers with `showLineNumbers`
- Line highlighting with `{3,5-7}`
- KaTeX math with inline `$$...$$` and fenced `math` blocks

Example:

````jsx
```ts {4-6} showLineNumbers
export const Settings = {
  features: {
    chatWithDocs: true,
    tableOfContents: true,
  },
}
```
````

## Usage Patterns By Page Type

### Overview Pages

- Open with a clear value statement.
- Use large cards for major paths.
- Include one Mermaid architecture or capability flow when it clarifies the product.
- Use a short feature table.
- Avoid step-by-step instructions unless the page is explicitly a quickstart.

### Quickstart And Guide Pages

- Use `Step` for the main workflow.
- Use `Tabs` for package managers, deployment targets, or providers.
- Use `Note type="warning"` for prerequisites and secrets.
- Include complete commands.
- End with related-page cards when useful.

### Authoring Reference Pages

- Show the rendered component first, then the MDX source.
- Use tables for component props and selection guidance.
- Include realistic Doxa examples, not placeholder content.
- Keep examples small enough to copy.

### AI And Search Pages

- Use Mermaid for request flow and agent behavior.
- Use tables for env vars, failure modes, and indexed data.
- Use notes for security-sensitive provider keys.
- Mention `contentStore`, `grep`, `cat`, `/llms.txt`, and `/llms-full.txt` only where relevant.

### Operations Pages

- Use tables for environment variables, commands, and adapter choices.
- Use `Step` for deployment and validation workflows.
- Use `FileTree` for folder or repo structure.
- Include explicit verification commands.

## Anti-patterns

1. Do not use h1 headings in MDX body content.
2. Do not write placeholder copy such as lorem ipsum or throwaway test text.
3. Do not refer to the old Documents or Next.js template unless writing migration history.
4. Do not call AI features "upcoming"; Chat with Docs and AI-native routes exist in Doxa.
5. Do not overuse notes. More than three or four callouts on one page usually means the prose needs tightening.
6. Do not put cards inside steps or notes inside notes.
7. Do not use steps for non-sequential feature lists.
8. Do not add Mermaid diagrams where a table or list is clearer.
9. Do not omit language identifiers on code fences.
10. Do not use `showLineNumbers` for one-line commands.

## Composition Rules

- `CardGrid` belongs at the beginning or end of a section.
- `Tabs` can be used inside `StepItem` for target-specific commands.
- Code fences inside JSX components need blank lines around them.
- `FileTree` and `Mermaid` complement each other: FileTree shows physical structure, Mermaid shows logical flow.
- Tables should introduce options before showing code examples that use those options.
- Notes should explain consequences or requirements, not repeat surrounding prose.

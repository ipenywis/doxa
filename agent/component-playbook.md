# Doxa Component Playbook

This is the authoritative reference for all MDX components and formatting features available in the Doxa documentation template. The documentation generation agent reads this file at runtime to understand what components exist, how to use them, and when to apply them.

**Update this file whenever components are added, changed, or removed from the template.**

---

## Frontmatter (Required)

Every page must start with YAML frontmatter. Values must be UNQUOTED:

```
---
title: Page Title Here
description: A brief description of this page
keywords: ["keyword1", "keyword2", "keyword3"]
---
```

- `title` (required): Page title — rendered as h1, do not repeat it in the body
- `description` (required): Brief page description for SEO
- `keywords` (optional): Array of SEO keywords

## Page Structure

- Each page is an `index.mdx` file inside a folder (folder name = URL slug)
- Use h2-h4 headings only (never h1 — the title from frontmatter is rendered as h1)
- Nesting is supported to arbitrary depth: `docs/section/subsection/page/index.mdx`
- The first line after frontmatter should be a paragraph or heading, never a component

---

## Component Catalog

### Cards (`CardGrid` + `Card`)

Display navigation or feature cards in a responsive grid (1 col mobile, 2 tablet, 3 desktop).

**Large card** (default variant):

```jsx
<CardGrid>
  <Card
    subtitle="Category Label"
    title="Card Title"
    description="Brief description of what this links to."
    href="/docs/path/to/page"
  />
  <Card
    subtitle="External"
    title="External Link"
    description="Links to an external site."
    href="https://example.com"
    external={true}
  />
</CardGrid>
```

**Small card** (compact, icon-based):

```jsx
<CardGrid>
  <Card
    title="Page Title"
    href="/docs/path"
    icon="alignJustify"
    variant="small"
    description="Optional short description"
  />
</CardGrid>
```

**Image card**:

```jsx
<CardGrid>
  <Card
    title="Visual Card"
    href="/docs/path"
    image="/images/preview.png"
    variant="image"
  />
</CardGrid>
```

**Props**: `title` (string), `subtitle?` (string), `description?` (string), `href` (string), `icon?` (keyof iconMap), `image?` (string), `variant?` ("small" | "image" | default large), `external?` (boolean), `className?` (string)

**Available icons**: `alignJustify`, `arrowUpRight` (extendable via `src/settings/icons.ts`)

---

### Notes / Callouts (`Note`)

Highlight important information with styled callout boxes.

```jsx
<Note title="Note Title">
  Content of the note. Supports **markdown** and `inline code`.
</Note>

<Note title="Success" type="success">
  Operation completed successfully.
</Note>

<Note title="Warning" type="warning">
  Be careful with this setting.
</Note>

<Note title="Danger" type="danger">
  This action is irreversible.
</Note>
```

**Props**: `title` (string), `type?` ("success" | "warning" | "danger" | default info/note)

---

### Steps (`Step` + `StepItem`)

Create numbered step-by-step guides with automatic numbering and a vertical connecting line.

```jsx
<Step>
  <StepItem title="Install Node.js">
    Make sure you have Node.js installed. Verify with:

    ```bash
    node -v
    ```

  </StepItem>

  <StepItem title="Install Dependencies">
    Navigate to the project directory and install:

    ```bash
    npm install
    ```

  </StepItem>

  <StepItem title="Run the Project">
    Start the development server:

    ```bash
    npm run dev
    ```

    Access the application at `http://localhost:3000`.

  </StepItem>
</Step>
```

**StepItem props**: `title` (string)

---

### Tabs (`Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`)

Show alternative content (e.g., different languages, package managers, or platforms).

```jsx
<Tabs defaultValue="npm" className="pt-5 pb-1">
  <TabsList>
    <TabsTrigger value="npm">npm</TabsTrigger>
    <TabsTrigger value="pnpm">pnpm</TabsTrigger>
    <TabsTrigger value="yarn">yarn</TabsTrigger>
  </TabsList>
  <TabsContent value="npm">
    ```bash
    npm install package-name
    ```
  </TabsContent>
  <TabsContent value="pnpm">
    ```bash
    pnpm add package-name
    ```
  </TabsContent>
  <TabsContent value="yarn">
    ```bash
    yarn add package-name
    ```
  </TabsContent>
</Tabs>
```

**Tabs props**: `defaultValue` (string matching a TabsTrigger value), `className?`
**TabsTrigger props**: `value` (string)
**TabsContent props**: `value` (string, must match a TabsTrigger)

---

### Mermaid Diagrams (`Mermaid`)

Render diagrams using Mermaid.js syntax. Supports flowcharts, sequence diagrams, ER diagrams, and more.

**Flowchart**:

```jsx
<Mermaid
  chart={`graph TD;
    A[Start] --> B{Decision};
    B -->|Yes| C[Action 1];
    B -->|No| D[Action 2];
    C --> E[End];
    D --> E;`}
/>
```

**ER diagram**:

```jsx
<Mermaid
  chart={`erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "included in"
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int orderNumber
        date orderDate
    }`}
/>
```

**Props**: `chart` (string — Mermaid diagram syntax wrapped in template literal), `className?` (string)

---

### File Tree (`FileTree` + `Folder` + `File`)

Visualize project or directory structures with an interactive tree.

```jsx
<FileTree>
  <Folder name="src" label="Source Code">
    <File name="index.tsx" label="Entry Point" />
    <Folder name="components" label="Components">
      <File name="Button.tsx" label="Button Component" />
      <File name="Input.tsx" label="Input Component" />
    </Folder>
    <Folder name="pages" label="Pages">
      <File name="home.tsx" label="Home Page" />
      <File name="about.tsx" label="About Page" />
    </Folder>
  </Folder>
</FileTree>
```

**Folder props**: `name` (string), `label?` (string), `open?` (boolean), `defaultOpen?` (boolean)
**File props**: `name` (string), `label?` (string)

---

### Standard Markdown Features

All standard markdown is supported:

**Code blocks** with syntax highlighting and line numbers:

````
```tsx showLineNumbers
const example = "highlighted";
```
````

**Line highlighting** — highlight specific lines:

````
```tsx {3,5-7} showLineNumbers
// line 3 and lines 5-7 will be highlighted
```
````

**Tables**:

```
| Column 1    | Column 2    | Column 3    |
| :---------- | :---------: | ----------: |
| Left-align  | Centered    | Right-align |
```

**Checklists**:

```
- [x] Completed task
- [ ] Pending task
```

**Blockquotes**:

```
> Important quote or callout text
```

**Math** (LaTeX via KaTeX):
- Inline: `$$E = mc^2$$`
- Block:
````
```math
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
```
````

**Images**:

```
![Alt text](/images/filename.png "Optional caption")
```

---

## Usage Patterns by Doc Type

These patterns describe WHEN and HOW to use each component depending on the type of documentation page being generated. Following these patterns produces consistent, professional documentation.

### Overview / Introduction Pages

- Open with a brief paragraph explaining what the project does
- Use `CardGrid` + `Card` (large variant) to link to main documentation sections
- Use a single `Mermaid` flowchart or architecture diagram if the project has complex structure
- Use `Note type="info"` sparingly for key prerequisites or version requirements
- Do NOT use Steps on overview pages — they belong on tutorial/getting-started pages

### Getting Started / Installation Pages

- Use `Step` + `StepItem` for the entire installation flow — every sequential action should be a step
- Use `Tabs` for package manager alternatives (npm/pnpm/yarn) or OS-specific instructions (macOS/Linux/Windows)
- Use `Note type="warning"` for prerequisites (Node.js version, required tools)
- Use `Note type="success"` after the final verification step to confirm success
- Include code blocks with `showLineNumbers` for config files

### Architecture / Concepts Pages

- Use `Mermaid` for architecture diagrams, data flow, and entity relationships
- Use `FileTree` to show project directory structure
- Use code blocks with line highlighting `{3,5-7}` to draw attention to key patterns
- Use `Note type="info"` for important architectural decisions or trade-offs
- Do NOT use Steps unless explaining a sequential process

### API Reference Pages

- Use markdown tables for every parameter, option, flag, and configuration field
- Use code blocks with `showLineNumbers` for all usage examples
- Use `Tabs` for language alternatives (JavaScript/TypeScript/Python) or different use cases
- Use `Note type="danger"` for breaking changes or deprecated features
- Use `Note type="warning"` for edge cases and important caveats
- Do NOT use Cards or Steps on API reference pages

### Guide / Tutorial Pages

- Use `Step` + `StepItem` for the main tutorial flow
- Use `Tabs` when steps differ by environment or platform
- Use `Note type="warning"` for common pitfalls
- Use `Note type="success"` for expected output verification
- Include complete, runnable code examples — never abbreviate with "..."
- Use `Mermaid` only if the guide involves a complex workflow that benefits from visualization

### Configuration Pages

- Use markdown tables for EVERY configurable field (name, type, default, description)
- Show both minimal and production-ready example config files
- Use `Tabs` for different config file formats (JSON/YAML/TOML) if applicable
- Use `Note type="warning"` for security-sensitive settings
- Use code blocks with line highlighting to point out critical fields

### CLI Reference Pages

- Use markdown tables for all commands, flags, and options
- Use code blocks for every command example with expected output
- Use `Note type="info"` for tips about common flag combinations
- Do NOT use Steps for CLI reference — use them only in CLI tutorials/guides

---

## Anti-patterns

These are common mistakes that degrade documentation quality. Avoid them.

1. **Don't overuse Notes** — If every other paragraph has a Note, they lose impact. Reserve them for genuinely important callouts (prerequisites, breaking changes, security warnings). A page with more than 3-4 Notes is likely overusing them.

2. **Don't use Cards inside Steps** — Cards are for navigation, Steps are for sequential instructions. They serve different purposes and should not be nested.

3. **Don't nest Notes inside Notes** — The component doesn't support nesting and it creates visual clutter.

4. **Don't use Steps for non-sequential content** — If the items don't need to happen in order, use bullet points or Cards instead.

5. **Don't put Mermaid diagrams on every page** — Limit to 1-2 per page, and only when visual representation adds clarity that text alone cannot provide. Architecture and data flow pages benefit most.

6. **Don't use image Cards without actual images** — If you don't have real image URLs, use the large or small card variants instead.

7. **Don't forget `defaultValue` on Tabs** — Without it, no tab is selected by default and users see blank content.

8. **Don't use h1 headings in the body** — The frontmatter `title` is rendered as h1. Start body headings at h2.

9. **Don't write code blocks without language identifiers** — Always specify the language (```typescript, ```bash, etc.) for proper syntax highlighting.

10. **Don't use `showLineNumbers` for single-line code** — Only add line numbers for code blocks longer than 3 lines.

---

## Component Composition Rules

These rules govern how components work together and what combinations produce the best results.

1. **CardGrid placement**: Always at the top or bottom of a section, never in the middle of a paragraph. Best used on overview/index pages to provide navigation.

2. **Tabs inside Steps**: This combination works well — a StepItem can contain a Tabs block for platform-specific instructions within a single step.

3. **Code blocks inside StepItem**: Always leave a blank line before and after the code fence inside a StepItem to ensure proper MDX parsing.

4. **Note after code blocks**: Place Notes immediately after code blocks to warn about edge cases or confirm expected output.

5. **FileTree + Mermaid complement**: On architecture pages, use FileTree for physical structure and Mermaid for logical relationships. They show different perspectives of the same system.

6. **Tables before code**: When documenting parameters/options, put the table first (what the options are), then the code example (how to use them).

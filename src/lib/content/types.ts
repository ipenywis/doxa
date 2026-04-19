/**
 * Content Access Types
 * ────────────────────
 * Shared interfaces for the content access layer.
 *
 * The ContentAdapter interface is the contract every storage backend must
 * implement. Ship two adapters out of the box (vite, github); users can add
 * their own by implementing this interface and registering in
 * src/settings/content.ts.
 */

export interface DocFrontmatter {
  title: string
  description: string
  keywords: string[]
}

export interface ContentEntry {
  /** URL-style slug, e.g. "/basic-setup/installation" */
  slug: string
  /** Virtual file path, e.g. "basic-setup/installation/index.mdx" */
  filePath: string
  /** Full raw MDX including frontmatter delimiters */
  rawContent: string
  /** Parsed YAML frontmatter */
  frontmatter: DocFrontmatter
  /** MDX body with frontmatter stripped */
  body: string
}

export interface GrepMatch {
  filePath: string
  lineNumber: number
  line: string
}

/**
 * Storage backend contract.
 *
 * Adapters return Promise<T> uniformly. Sync adapters (ViteAdapter) wrap their
 * results with Promise.resolve — keeps consumer code simple (always `await`).
 */
export interface ContentAdapter {
  /** All known file paths relative to the docs root */
  listFiles(): Promise<string[]>
  /** Raw MDX content for a path, or null if not found */
  readFile(filePath: string): Promise<string | null>
  /** Human-readable adapter name for logs/errors */
  readonly name: string
}

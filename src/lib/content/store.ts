/**
 * ContentStore
 * ────────────
 * Unified content access layer. Instantiated with a ContentAdapter and
 * exposes a stable, async API for all consumers (agent tools, AI routes,
 * search index, route renderer).
 *
 * Swap the underlying adapter by editing src/settings/content.ts — consumer
 * code doesn't change.
 */

import grayMatter from "gray-matter";

import { resolveAdapter } from "@/src/settings/content";
import type {
  ContentAdapter,
  ContentEntry,
  DocFrontmatter,
  GrepMatch,
} from "@/src/lib/content/types";

export class ContentStore {
  private entryCache = new Map<string, ContentEntry>();
  private pathsPromise: Promise<string[]> | null = null;

  constructor(private adapter: ContentAdapter) {}

  /** Adapter name for debugging / logging */
  get source(): string {
    return this.adapter.name;
  }

  /** List all virtual file paths, e.g. "basic-setup/installation/index.mdx" */
  async getAllPaths(): Promise<string[]> {
    if (!this.pathsPromise) {
      this.pathsPromise = this.adapter.listFiles();
    }
    return this.pathsPromise;
  }

  /** List all slugs, e.g. "/basic-setup/installation" */
  async getAllSlugs(): Promise<string[]> {
    const paths = await this.getAllPaths();
    return paths.map(filePathToSlug);
  }

  /** Load all entries (fully parsed). Cached after first call. */
  async getAllEntries(): Promise<ContentEntry[]> {
    const paths = await this.getAllPaths();
    return Promise.all(paths.map((p) => this.getEntry(p))).then((entries) =>
      entries.filter((e): e is ContentEntry => e !== null)
    );
  }

  /** Get a single entry by file path or slug. Returns null if not found. */
  async getEntry(input: string): Promise<ContentEntry | null> {
    const filePath = normalizeFilePath(input);
    const cached = this.entryCache.get(filePath);
    if (cached) return cached;

    const raw = await this.adapter.readFile(filePath);
    if (raw === null) return null;

    const entry = parseEntry(filePath, raw);
    this.entryCache.set(filePath, entry);
    return entry;
  }

  /** Raw MDX content for an entry, or null if not found. For `cat` tool. */
  async readRaw(input: string): Promise<string | null> {
    const entry = await this.getEntry(input);
    return entry?.rawContent ?? null;
  }

  /** Check whether a path or slug resolves to a known entry */
  async isValidPath(input: string): Promise<boolean> {
    const filePath = normalizeFilePath(input);
    const paths = await this.getAllPaths();
    return paths.includes(filePath);
  }

  /**
   * Regex search across all entry rawContent. Returns line-level matches.
   * Optional `prefix` filters entries whose filePath starts with the prefix.
   */
  async searchContent(pattern: RegExp, prefix?: string): Promise<GrepMatch[]> {
    const entries = await this.getAllEntries();
    const normalizedPrefix = prefix
      ? normalizeFilePath(prefix).replace(/\/index\.mdx$/, "")
      : null;

    const matches: GrepMatch[] = [];
    for (const entry of entries) {
      if (normalizedPrefix && !entry.filePath.startsWith(normalizedPrefix))
        continue;

      const lines = entry.rawContent.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          matches.push({
            filePath: entry.filePath,
            lineNumber: i + 1,
            line: lines[i],
          });
          pattern.lastIndex = 0; // reset for non-/g regexes used across lines
        }
      }
    }

    return matches;
  }
}

/**
 * Normalize user input into a canonical file path.
 *   "basic-setup/installation"          → "basic-setup/installation/index.mdx"
 *   "basic-setup/installation/index.mdx" → "basic-setup/installation/index.mdx"
 *   "/basic-setup/installation"         → "basic-setup/installation/index.mdx"
 *   "/basic-setup/installation/index.mdx" → "basic-setup/installation/index.mdx"
 */
export function normalizeFilePath(input: string): string {
  let path = input.trim();
  if (path.startsWith("/")) path = path.slice(1);
  if (!path.endsWith(".mdx")) path = `${path.replace(/\/$/, "")}/index.mdx`;
  return path;
}

/**
 * Convert a file path to its URL slug.
 *   "basic-setup/installation/index.mdx" → "/basic-setup/installation"
 *   "another-page/index.mdx"             → "/another-page"
 */
export function filePathToSlug(filePath: string): string {
  const withoutIndex = filePath.replace(/\/index\.mdx$/, "");
  return `/${withoutIndex}`;
}

function parseEntry(filePath: string, raw: string): ContentEntry {
  const parsed = grayMatter(raw);
  const data = parsed.data as Partial<{
    title: unknown;
    description: unknown;
    keywords: unknown;
  }>;

  const frontmatter: DocFrontmatter = {
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    keywords: Array.isArray(data.keywords)
      ? data.keywords.filter((k): k is string => typeof k === "string")
      : [],
  };

  return {
    slug: filePathToSlug(filePath),
    filePath,
    rawContent: raw,
    frontmatter,
    body: parsed.content,
  };
}

/** Singleton — adapter picked from env via src/settings/content.ts */
export const contentStore = new ContentStore(resolveAdapter());

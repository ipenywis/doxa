/**
 * Docs Sync Module
 *
 * Discovers new MDX pages and appends them to documents.json.
 * documents.json is the single source of truth for navigation.
 *
 * Usage:
 *   pnpm generate:docs          # Sync once
 *   pnpm generate:docs --watch  # Watch for new files
 */

export { syncDocs, watchDocs } from "./generator";
export type { MdxFrontmatter, Paths } from "./types";

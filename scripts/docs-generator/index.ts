/**
 * Docs Generator Module
 *
 * Automatically generates documents.ts from the docs folder structure.
 *
 * Usage:
 *   pnpm generate:docs          # Generate once
 *   pnpm generate:docs --watch  # Watch for changes
 */

export { generateDocs, watchDocs } from "./generator"
export type {
  DocItemConfig,
  DocNode,
  DocsGeneratorConfig,
  MdxFrontmatter,
  Paths,
} from "./types"

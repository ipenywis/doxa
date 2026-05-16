/**
 * Types for the automatic docs generator
 *
 * This system watches the src/contents/docs folder and generates
 * the documents.ts configuration file automatically.
 */

import type { Paths } from "@/src/lib/pageroutes";

/**
 * Configuration for a single document or folder
 * Can be used to customize ordering, headings, etc.
 */
export interface DocItemConfig {
  /** Custom title (overrides frontmatter title) */
  title?: string;
  /** Section heading displayed above this item */
  heading?: string;
  /** If true, this item won't be a clickable link */
  noLink?: boolean;
  /** Custom order for children (array of folder/file names) */
  order?: string[];
  /** If true, this item is hidden from the menu */
  hidden?: boolean;
}

/**
 * Configuration for the docs generator
 */
export interface DocsGeneratorConfig {
  /**
   * Configuration for specific paths
   * Keys are relative paths from the docs folder (e.g., "basic-setup", "markdown/cards")
   */
  items?: Record<string, DocItemConfig>;

  /**
   * Spacers to insert at specific positions
   * Keys are the path BEFORE which to insert a spacer
   */
  spacersBefore?: string[];

  /**
   * Root level ordering of items
   * Array of folder/file names in desired order
   * Items not in this array will be appended alphabetically
   */
  order?: string[];

  /**
   * Default heading for the first item in the list
   */
  defaultHeading?: string;
}

/**
 * Frontmatter extracted from MDX files
 */
export interface MdxFrontmatter {
  title?: string;
  description?: string;
  keywords?: string[];
  /** Optional: order for child items */
  order?: number;
  /** Optional: heading for this section */
  heading?: string;
  /** Optional: icon name (key in src/settings/icons.ts iconMap) shown in the sidebar */
  icon?: string;
  /** Optional: hide from menu */
  hidden?: boolean;
}

/**
 * Internal representation of a document during generation
 */
export interface DocNode {
  /** The folder/file name (slug) */
  name: string;
  /** Full relative path from docs folder */
  path: string;
  /** Title from frontmatter or derived from name */
  title: string;
  /** Whether this has an index.mdx file */
  hasIndex: boolean;
  /** Child documents/folders */
  children: DocNode[];
  /** Frontmatter data from index.mdx */
  frontmatter: MdxFrontmatter;
}

/**
 * Result of scanning the docs folder
 */
export interface ScanResult {
  nodes: DocNode[];
  errors: string[];
}

/**
 * Export the Paths type for convenience
 */
export type { Paths };

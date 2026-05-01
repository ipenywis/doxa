/**
 * Types for the docs sync tool
 *
 * documents.json is the single source of truth for navigation.
 * The sync tool only discovers new MDX pages and appends them.
 */

/**
 * Route path type — matches the Paths type in pageroutes.ts
 */
export type Paths =
  | {
      title: string;
      href: string;
      icon?: string;
      noLink?: true;
      heading?: string;
      items?: Paths[];
    }
  | {
      heading: string;
    }
  | {
      spacer: true;
    };

/**
 * Frontmatter extracted from MDX files
 */
export interface MdxFrontmatter {
  title?: string;
  description?: string;
  keywords?: string[];
  /** Optional: icon name (key in src/settings/icons.ts iconMap) shown in the sidebar */
  icon?: string;
  /** Optional: hide from menu */
  hidden?: boolean;
}

/**
 * Types for the docs generator config
 * These are inlined to avoid import issues between src and scripts
 */
interface DocItemConfig {
  title?: string
  heading?: string
  noLink?: boolean
  order?: string[]
  hidden?: boolean
}

interface DocsGeneratorConfig {
  items?: Record<string, DocItemConfig>
  spacersBefore?: string[]
  order?: string[]
  defaultHeading?: string
}

/**
 * Configuration for the automatic docs generator
 *
 * This file controls how the documents.ts is generated from the file structure.
 * The generator will scan src/contents/docs and create the navigation based on:
 * 1. The folder structure
 * 2. Frontmatter titles from index.mdx files
 * 3. This configuration for ordering, headings, and spacers
 *
 * Run `pnpm generate:docs` to regenerate documents.ts
 * Run `pnpm generate:docs --watch` to watch for changes during development
 */
export const docsConfig: DocsGeneratorConfig = {
  /**
   * Root level ordering of documentation sections
   * Items not listed here will be appended alphabetically at the end
   */
  order: ["basic-setup", "navigation", "structure", "markdown", "random"],

  /**
   * Insert spacers before these paths
   * Spacers create visual separation in the menu
   */
  spacersBefore: ["navigation", "markdown"],

  /**
   * Configuration for specific paths
   * Keys are relative paths from the docs folder
   */
  items: {
    // Introduction section
    "basic-setup": {
      title: "Basic Setup",
      heading: "Introduction",
      order: ["installation", "setup", "changelog"],
    },

    // Documents section
    navigation: {
      title: "Navigation",
      heading: "Documents",
    },

    // Structure section (nested example)
    structure: {
      title: "Structure",
      order: ["deep"],
    },
    "structure/deep": {
      title: "Deep",
      order: ["deeper"],
    },
    "structure/deep/deeper": {
      title: "Deeper",
      order: ["even-deeper"],
    },
    "structure/deep/deeper/even-deeper": {
      title: "Even deeper",
    },

    // Components section
    markdown: {
      title: "Markdown",
      heading: "Components",
      order: [
        "cards",
        "diagrams",
        "filetree",
        "lists",
        "maths",
        "notes",
        "steps",
        "table",
        "tabs",
      ],
    },

    // Random section (optional)
    random: {
      title: "Random",
    },
  },
}

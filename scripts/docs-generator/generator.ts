/**
 * Docs Generator - Automatically generates documents.ts from file structure
 *
 * This script scans the src/contents/docs folder and generates the navigation
 * configuration file based on:
 * 1. The folder structure (nested directories = nested menu items)
 * 2. Frontmatter from index.mdx files (title, description, etc.)
 * 3. Configuration from docs.config.ts (ordering, headings, spacers)
 *
 * Usage:
 *   pnpm generate:docs          # Generate once
 *   pnpm generate:docs --watch  # Watch for changes
 */

import { promises as fs } from "fs"
import path from "path"
import { watch as fsWatch } from "fs"

import grayMatter from "gray-matter"

import type {
  DocItemConfig,
  DocNode,
  DocsGeneratorConfig,
  MdxFrontmatter,
  Paths,
} from "./types"

// Paths
const ROOT_DIR = process.cwd()
const DOCS_DIR = path.join(ROOT_DIR, "src", "contents", "docs")
const CONFIG_PATH = path.join(
  ROOT_DIR,
  "src",
  "contents",
  "settings",
  "docs.config.ts"
)
const OUTPUT_PATH = path.join(
  ROOT_DIR,
  "src",
  "contents",
  "settings",
  "documents.ts"
)

/**
 * Convert a slug to a title-case string
 * e.g., "basic-setup" -> "Basic Setup"
 */
function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Parse frontmatter from an MDX file
 */
async function parseFrontmatter(filePath: string): Promise<MdxFrontmatter> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const { data } = grayMatter(content)
    return data as MdxFrontmatter
  } catch {
    return {}
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Recursively scan a directory for docs
 */
async function scanDirectory(
  dirPath: string,
  relativePath: string = ""
): Promise<DocNode[]> {
  const nodes: DocNode[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const directories = entries.filter((entry) => entry.isDirectory())

    for (const dir of directories) {
      const fullPath = path.join(dirPath, dir.name)
      const childRelativePath = relativePath
        ? `${relativePath}/${dir.name}`
        : dir.name

      // Check for index.mdx
      const indexPath = path.join(fullPath, "index.mdx")
      const hasIndex = await fileExists(indexPath)

      // Parse frontmatter if index exists
      let frontmatter: MdxFrontmatter = {}
      if (hasIndex) {
        frontmatter = await parseFrontmatter(indexPath)
      }

      // Skip hidden items
      if (frontmatter.hidden) {
        continue
      }

      // Recursively scan children
      const children = await scanDirectory(fullPath, childRelativePath)

      // Only include if it has an index or has children with indexes
      if (hasIndex || children.length > 0) {
        nodes.push({
          name: dir.name,
          path: childRelativePath,
          title: frontmatter.title || slugToTitle(dir.name),
          hasIndex,
          children,
          frontmatter,
        })
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error)
  }

  return nodes
}

/**
 * Sort nodes based on config order
 */
function sortNodes(nodes: DocNode[], order: string[] | undefined): DocNode[] {
  if (!order || order.length === 0) {
    // Default alphabetical sort
    return [...nodes].sort((a, b) => a.name.localeCompare(b.name))
  }

  const orderMap = new Map(order.map((name, index) => [name, index]))
  const sorted = [...nodes].sort((a, b) => {
    const aOrder = orderMap.get(a.name) ?? Infinity
    const bOrder = orderMap.get(b.name) ?? Infinity

    if (aOrder === bOrder) {
      // Both are not in order list, sort alphabetically
      return a.name.localeCompare(b.name)
    }
    return aOrder - bOrder
  })

  return sorted
}

/**
 * Convert DocNode tree to Paths array
 */
function nodesToPaths(
  nodes: DocNode[],
  config: DocsGeneratorConfig,
  _parentPath: string = ""
): Paths[] {
  const paths: Paths[] = []

  for (const node of nodes) {
    const itemConfig = config.items?.[node.path] as DocItemConfig | undefined

    // Check if we need a spacer before this item
    if (config.spacersBefore?.includes(node.path)) {
      paths.push({ spacer: true })
    }

    // Build the path item
    const pathItem: Paths = {
      title: itemConfig?.title || node.title,
      href: `/${node.name}`,
    }

    // Add heading if specified
    const heading = itemConfig?.heading || node.frontmatter.heading
    if (heading) {
      ;(pathItem as Extract<Paths, { title: string }>).heading = heading
    }

    // Add noLink if specified
    if (itemConfig?.noLink) {
      ;(pathItem as Extract<Paths, { title: string }>).noLink = true
    }

    // Process children
    if (node.children.length > 0) {
      // Sort children based on config
      const sortedChildren = sortNodes(node.children, itemConfig?.order)
      const childPaths = nodesToPaths(sortedChildren, config, node.path)

      if (childPaths.length > 0) {
        ;(pathItem as Extract<Paths, { title: string }>).items = childPaths
      }
    }

    paths.push(pathItem)
  }

  return paths
}

/**
 * Generate the documents.ts file content
 */
function generateDocumentsFile(paths: Paths[]): string {
  const formatPath = (p: Paths, indent: number = 2): string => {
    const spaces = " ".repeat(indent)
    if ("spacer" in p) {
      return `${spaces}{\n${spaces}  spacer: true,\n${spaces}}`
    }

    let result = `${spaces}{\n`
    if (p.heading) {
      result += `${spaces}  heading: "${p.heading}",\n`
    }
    result += `${spaces}  title: "${p.title}",\n`
    result += `${spaces}  href: "${p.href}",\n`
    if (p.noLink) {
      result += `${spaces}  noLink: true,\n`
    }
    if (p.items && p.items.length > 0) {
      result += `${spaces}  items: [\n`
      result += p.items.map((item) => formatPath(item, indent + 4)).join(",\n")
      result += `,\n${spaces}  ],\n`
    }
    result += `${spaces}}`
    return result
  }

  const pathsStr = paths.map((p) => formatPath(p)).join(",\n")

  return `import { Paths } from "@/src/lib/pageroutes"

// Auto-generated by docs-generator. Do not edit manually.
// Run \`pnpm generate:docs\` to regenerate.
// Configure in src/contents/settings/docs.config.ts

export const Documents: Paths[] = [
${pathsStr},
]
`
}

/**
 * Load the docs config using dynamic import
 */
async function loadConfig(): Promise<DocsGeneratorConfig> {
  try {
    // We need to read and parse the config file manually since it uses path aliases
    const configContent = await fs.readFile(CONFIG_PATH, "utf-8")

    // Extract the config object from the file
    const configMatch = configContent.match(
      /export\s+const\s+docsConfig\s*:\s*DocsGeneratorConfig\s*=\s*(\{[\s\S]*\})\s*$/m
    )

    if (configMatch) {
      // Parse the config object
      // This is a simple parser that handles the specific format we use
      const configStr = configMatch[1]
      // Use eval in a controlled way (this is safe as we control the config file)
      // eslint-disable-next-line no-eval
      const config = eval(`(${configStr})`) as DocsGeneratorConfig
      return config
    }

    console.warn("Could not parse docs.config.ts, using defaults")
    return {}
  } catch (error) {
    console.warn("Could not load docs.config.ts, using defaults:", error)
    return {}
  }
}

/**
 * Main generation function
 */
export async function generateDocs(): Promise<void> {
  console.log("Scanning docs folder...")

  // Scan the docs directory
  const nodes = await scanDirectory(DOCS_DIR)

  if (nodes.length === 0) {
    console.warn("No documentation found in", DOCS_DIR)
    return
  }

  console.log(`Found ${nodes.length} root level docs`)

  // Load config
  const config = await loadConfig()

  // Sort root nodes
  const sortedNodes = sortNodes(nodes, config.order)

  // Convert to Paths
  const paths = nodesToPaths(sortedNodes, config)

  // Generate the file content
  const content = generateDocumentsFile(paths)

  // Write the file
  await fs.writeFile(OUTPUT_PATH, content, "utf-8")

  console.log(`Generated ${OUTPUT_PATH}`)
}

/**
 * Watch mode - regenerate on file changes
 */
export async function watchDocs(): Promise<void> {
  console.log("Starting docs generator in watch mode...")
  console.log(`Watching: ${DOCS_DIR}`)
  console.log(`Config: ${CONFIG_PATH}`)
  console.log("")

  // Initial generation
  await generateDocs()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const onChange = (_eventType: string, filename: string | null) => {
    // Debounce rapid changes
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(async () => {
      console.log(`\nChange detected: ${filename || "unknown"}`)
      try {
        await generateDocs()
      } catch (error) {
        console.error("Error regenerating docs:", error)
      }
    }, 300)
  }

  // Watch docs directory
  fsWatch(DOCS_DIR, { recursive: true }, onChange)

  // Watch config file
  fsWatch(path.dirname(CONFIG_PATH), (eventType, filename) => {
    if (filename === "docs.config.ts") {
      onChange(eventType, filename)
    }
  })

  console.log("\nWatching for changes... (press Ctrl+C to stop)")
}

// CLI entry point
const args = process.argv.slice(2)
const isWatch = args.includes("--watch") || args.includes("-w")

if (isWatch) {
  watchDocs().catch(console.error)
} else {
  generateDocs().catch(console.error)
}

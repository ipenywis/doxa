/**
 * Docs Sync — Discovers new MDX pages and appends them to documents.json
 *
 * documents.json is the single source of truth for navigation structure
 * (order, headings, spacers). This script only adds missing pages — it
 * never reorders, removes, or overwrites existing entries.
 *
 * Usage:
 *   pnpm generate:docs          # Sync once
 *   pnpm generate:docs --watch  # Watch for new files
 */

import { promises as fs } from "fs"
import path from "path"
import { watch as fsWatch } from "fs"

import grayMatter from "gray-matter"

// Paths
const ROOT_DIR = process.cwd()
const DOCS_DIR = path.join(ROOT_DIR, "src", "contents", "docs")
const OUTPUT_PATH = path.join(
  ROOT_DIR,
  "src",
  "contents",
  "settings",
  "documents.json"
)

interface MdxFrontmatter {
  title?: string
  description?: string
  keywords?: string[]
  hidden?: boolean
}

interface PathEntry {
  title?: string
  href?: string
  heading?: string
  spacer?: true
  noLink?: true
}

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
 * Recursively find all MDX doc pages and return their hrefs + titles
 */
async function discoverPages(
  dirPath: string,
  parentHref: string = ""
): Promise<{ href: string; title: string }[]> {
  const pages: { href: string; title: string }[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const directories = entries
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))

    for (const dir of directories) {
      const fullPath = path.join(dirPath, dir.name)
      const indexPath = path.join(fullPath, "index.mdx")
      const href = `${parentHref}/${dir.name}`

      try {
        await fs.access(indexPath)
      } catch {
        // No index.mdx — check children anyway
        const childPages = await discoverPages(fullPath, href)
        pages.push(...childPages)
        continue
      }

      const frontmatter = await parseFrontmatter(indexPath)

      // Skip hidden pages
      if (frontmatter.hidden) continue

      const title = frontmatter.title || slugToTitle(dir.name)
      pages.push({ href, title })

      // Recurse into children
      const childPages = await discoverPages(fullPath, href)
      pages.push(...childPages)
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error)
  }

  return pages
}

/**
 * Load existing documents.json
 */
async function loadExistingDocuments(): Promise<PathEntry[]> {
  try {
    const content = await fs.readFile(OUTPUT_PATH, "utf-8")
    return JSON.parse(content) as PathEntry[]
  } catch {
    return []
  }
}

/**
 * Get all hrefs currently in documents.json
 */
function getExistingHrefs(documents: PathEntry[]): Set<string> {
  const hrefs = new Set<string>()
  for (const entry of documents) {
    if (entry.href) {
      hrefs.add(entry.href)
    }
  }
  return hrefs
}

/**
 * Main sync function — appends new pages to documents.json
 */
export async function syncDocs(): Promise<void> {
  console.log("Scanning for new docs...")

  // Discover all MDX pages on disk
  const allPages = await discoverPages(DOCS_DIR)

  if (allPages.length === 0) {
    console.warn("No documentation found in", DOCS_DIR)
    return
  }

  console.log(`Found ${allPages.length} pages on disk`)

  // Load existing documents.json
  const documents = await loadExistingDocuments()
  const existingHrefs = getExistingHrefs(documents)

  // Find pages that aren't in documents.json yet
  const newPages = allPages.filter((page) => !existingHrefs.has(page.href))

  if (newPages.length === 0) {
    console.log("All pages are already in documents.json — nothing to add")
    return
  }

  console.log(`Adding ${newPages.length} new page(s):`)
  for (const page of newPages) {
    console.log(`  + ${page.href} (${page.title})`)
    documents.push({ title: page.title, href: page.href })
  }

  // Write back
  await fs.writeFile(
    OUTPUT_PATH,
    JSON.stringify(documents, null, 2) + "\n",
    "utf-8"
  )

  console.log(`Updated ${OUTPUT_PATH}`)
}

/**
 * Watch mode — sync on file changes
 */
export async function watchDocs(): Promise<void> {
  console.log("Starting docs sync in watch mode...")
  console.log(`Watching: ${DOCS_DIR}`)
  console.log("")

  // Initial sync
  await syncDocs()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const onChange = (_eventType: string, filename: string | null) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(async () => {
      console.log(`\nChange detected: ${filename || "unknown"}`)
      try {
        await syncDocs()
      } catch (error) {
        console.error("Error syncing docs:", error)
      }
    }, 300)
  }

  fsWatch(DOCS_DIR, { recursive: true }, onChange)

  console.log("Watching for changes... (press Ctrl+C to stop)")
}

// CLI entry point
const args = process.argv.slice(2)
const isWatch = args.includes("--watch") || args.includes("-w")

if (isWatch) {
  watchDocs().catch(console.error)
} else {
  syncDocs().catch(console.error)
}

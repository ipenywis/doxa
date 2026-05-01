/**
 * Docs Sync — Discovers new MDX pages and appends them to per-section nav files.
 *
 * Each section configured in `src/settings/sections.ts` gets its own nav file:
 *   - default section → src/contents/settings/documents.json
 *   - other sections  → src/contents/settings/documents.<slug>.json
 *
 * Behaviour:
 *   - Append-only for entries (never reorders, removes, or rewrites the order).
 *   - Updates the `icon` field on existing entries when MDX frontmatter
 *     declares an icon — keeps sidebar icons in sync without disturbing order.
 *
 * Usage:
 *   pnpm generate:docs          # Sync once
 *   pnpm generate:docs --watch  # Watch for new files
 */

import { promises as fs, watch as fsWatch } from "fs";
import path from "path";

import grayMatter from "gray-matter";

import {
  nonDefaultSections,
  sections,
  type SectionConfig,
} from "@/src/settings/sections";

const ROOT_DIR = process.cwd();
const DOCS_DIR = path.join(ROOT_DIR, "src", "contents", "docs");
const SETTINGS_DIR = path.join(ROOT_DIR, "src", "contents", "settings");

interface MdxFrontmatter {
  title?: string;
  description?: string;
  keywords?: string[];
  icon?: string;
  hidden?: boolean;
}

interface PathEntry {
  title?: string;
  href?: string;
  icon?: string;
  heading?: string;
  spacer?: true;
  noLink?: true;
}

interface DiscoveredPage {
  href: string;
  title: string;
  icon?: string;
}

const reservedSlugs = new Set(nonDefaultSections.map((s) => s.slug));

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function parseFrontmatter(filePath: string): Promise<MdxFrontmatter> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const { data } = grayMatter(content);
    return data as MdxFrontmatter;
  } catch {
    return {};
  }
}

/**
 * Recursively discover MDX pages under `dirPath`.
 * `parentHref` is the href prefix (e.g. "" for default, "/api-reference" for a section).
 * `topLevelSkip` is consulted only at the immediate children of the section root —
 * used so the default section ignores folders owned by non-default sections.
 */
async function discoverPages(
  dirPath: string,
  parentHref: string,
  topLevelSkip: Set<string> | null
): Promise<DiscoveredPage[]> {
  const pages: DiscoveredPage[] = [];

  let entries: import("fs").Dirent[];
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return pages;
  }

  const directories = entries
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const dir of directories) {
    if (topLevelSkip && topLevelSkip.has(dir.name)) continue;

    const fullPath = path.join(dirPath, dir.name);
    const indexPath = path.join(fullPath, "index.mdx");
    const href = `${parentHref}/${dir.name}`;

    let hasIndex = true;
    try {
      await fs.access(indexPath);
    } catch {
      hasIndex = false;
    }

    if (hasIndex) {
      const frontmatter = await parseFrontmatter(indexPath);
      if (!frontmatter.hidden) {
        pages.push({
          href,
          title: frontmatter.title || slugToTitle(dir.name),
          ...(frontmatter.icon ? { icon: frontmatter.icon } : {}),
        });
      }
    }

    pages.push(...(await discoverPages(fullPath, href, null)));
  }

  return pages;
}

function outputPathForSection(section: SectionConfig): string {
  return section.default
    ? path.join(SETTINGS_DIR, "documents.json")
    : path.join(SETTINGS_DIR, `documents.${section.slug}.json`);
}

function rootDirForSection(section: SectionConfig): string {
  return section.default ? DOCS_DIR : path.join(DOCS_DIR, section.slug);
}

async function loadExisting(filePath: string): Promise<PathEntry[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as PathEntry[];
  } catch {
    return [];
  }
}

async function syncSection(section: SectionConfig): Promise<void> {
  const sectionRoot = rootDirForSection(section);
  const outputPath = outputPathForSection(section);
  const hrefPrefix = section.default ? "" : `/${section.slug}`;

  // Non-default section may not have a folder yet — skip silently.
  if (!section.default) {
    try {
      await fs.access(sectionRoot);
    } catch {
      console.log(
        `  · ${section.slug}: folder not found at src/contents/docs/${section.slug} — skipping`
      );
      return;
    }
  }

  const topLevelSkip = section.default ? reservedSlugs : null;
  const pages = await discoverPages(sectionRoot, hrefPrefix, topLevelSkip);

  // For non-default sections, also emit the section root's own index.mdx
  // (e.g. /development → src/contents/docs/development/index.mdx) so the
  // section landing page appears at the top of its sidebar.
  if (!section.default) {
    const rootIndex = path.join(sectionRoot, "index.mdx");
    try {
      await fs.access(rootIndex);
      const fm = await parseFrontmatter(rootIndex);
      if (!fm.hidden) {
        pages.unshift({
          href: hrefPrefix,
          title: fm.title || slugToTitle(section.slug),
          ...(fm.icon ? { icon: fm.icon } : {}),
        });
      }
    } catch {
      // No section landing page — that's fine, just skip.
    }
  }

  const existing = await loadExisting(outputPath);
  const byHref = new Map<string, PathEntry>();
  for (const entry of existing) {
    if (entry.href) byHref.set(entry.href, entry);
  }

  let added = 0;
  let iconChanged = 0;

  for (const page of pages) {
    const found = byHref.get(page.href);
    if (!found) {
      const next: PathEntry = { title: page.title, href: page.href };
      if (page.icon) next.icon = page.icon;
      existing.push(next);
      byHref.set(page.href, next);
      added++;
      console.log(
        `    + ${page.href} (${page.title}${page.icon ? `, icon: ${page.icon}` : ""})`
      );
    } else {
      // Keep title untouched (user may have customised it). Sync icon: add,
      // change, or remove based on frontmatter.
      if (page.icon !== found.icon) {
        if (page.icon) found.icon = page.icon;
        else delete found.icon;
        iconChanged++;
      }
    }
  }

  if (added === 0 && iconChanged === 0 && existing.length > 0) {
    return; // Nothing to write.
  }

  await fs.writeFile(
    outputPath,
    JSON.stringify(existing, null, 2) + "\n",
    "utf-8"
  );
  const rel = path.relative(ROOT_DIR, outputPath);
  console.log(
    `  · ${section.slug}: ${added} new, ${iconChanged} icon update${iconChanged === 1 ? "" : "s"} → ${rel}`
  );
}

export async function syncDocs(): Promise<void> {
  console.log(`Scanning docs across ${sections.length} section(s)…`);
  for (const section of sections) {
    await syncSection(section);
  }
}

export async function watchDocs(): Promise<void> {
  console.log("Starting docs sync in watch mode…");
  console.log(`Watching: ${DOCS_DIR}`);
  console.log("");

  await syncDocs();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const onChange = (_eventType: string, filename: string | null) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log(`\nChange detected: ${filename || "unknown"}`);
      try {
        await syncDocs();
      } catch (error) {
        console.error("Error syncing docs:", error);
      }
    }, 300);
  };

  fsWatch(DOCS_DIR, { recursive: true }, onChange);
  console.log("Watching for changes… (press Ctrl+C to stop)");
}

const args = process.argv.slice(2);
const isWatch = args.includes("--watch") || args.includes("-w");

if (isWatch) {
  watchDocs().catch(console.error);
} else {
  syncDocs().catch(console.error);
}

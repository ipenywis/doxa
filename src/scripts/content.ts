import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Documents from "@/src/contents/settings/documents.json";
import grayMatter from "gray-matter";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { Node, Parent } from "unist";
import { visit } from "unist-util-visit";

import {
  defaultSection,
  isSectionSlug,
  nonDefaultSections,
} from "@/src/settings/sections";
import { Paths } from "@/src/lib/pageroutes";
import { buildBreadcrumbMap } from "@/src/lib/search/breadcrumb";
import { buildIndex, serializeIndex } from "@/src/lib/search/mini-search";
import type { SearchIndexEntry, SearchIndexLine } from "@/src/lib/search/types";

const docsDir = path.join(process.cwd(), "src/contents/docs");
const outputDir = path.join(process.cwd(), "public", "search-data");

interface MdxJsxFlowElement extends Node {
  name: string;
  children?: Node[];
}

function isMdxJsxFlowElement(node: Node): node is MdxJsxFlowElement {
  return node.type === "mdxJsxFlowElement" && "name" in node;
}

function isRoute(
  node: Paths
): node is Extract<Paths, { href: string; title: string }> {
  return "href" in node && "title" in node;
}

/**
 * Strip the optional `default/` folder prefix so URLs for default-section
 * pages stay rootless (`/quickstart`, not `/default/quickstart`). Mirrors
 * the contract enforced by the content adapters.
 */
const DEFAULT_SECTION_DIR = "default";

function stripDefaultSectionPrefix(relativePath: string): string {
  const segments = relativePath.split(/[\\/]/);
  if (segments[0] === DEFAULT_SECTION_DIR) {
    return segments.slice(1).join("/");
  }
  return relativePath.replace(/\\/g, "/");
}

function createSlug(filePath: string): string {
  const relativePath = path.relative(docsDir, filePath);
  const canonical = stripDefaultSectionPrefix(relativePath);
  const parsed = path.parse(canonical);

  const slugPath = parsed.dir ? `${parsed.dir}/${parsed.name}` : parsed.name;
  const normalizedSlug = slugPath.replace(/\\/g, "/");

  if (parsed.name === "index") {
    const dir = parsed.dir.replace(/\\/g, "/");
    return dir ? `/${dir}` : "/";
  }

  return `/${normalizedSlug}`;
}

async function loadSectionDocs(): Promise<Map<string, Paths[]>> {
  const map = new Map<string, Paths[]>();
  map.set(defaultSection.slug, Documents as Paths[]);
  for (const section of nonDefaultSections) {
    const filePath = path.join(
      process.cwd(),
      "src",
      "contents",
      "settings",
      `documents.${section.slug}.json`
    );
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      map.set(section.slug, JSON.parse(raw) as Paths[]);
    } catch {
      map.set(section.slug, []);
    }
  }
  return map;
}

function sectionForSlug(slug: string): string {
  const segments = slug.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isSectionSlug(first)) return first;
  return defaultSection.slug;
}

function findDocumentBySlug(
  slug: string,
  docsBySection: Map<string, Paths[]>
): Paths | null {
  const docs = docsBySection.get(sectionForSlug(slug)) ?? [];
  for (const doc of docs) {
    if (isRoute(doc) && doc.href === slug) {
      return doc;
    }
  }
  return null;
}

async function ensureDirectoryExists(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

function removeCustomComponents() {
  const customComponentNames = [
    "Tabs",
    "TabsList",
    "TabsTrigger",
    "pre",
    "Mermaid",
    "Card",
    "CardGrid",
    "Step",
    "StepItem",
    "Note",
    "FileTree",
    "Folder",
    "File",
  ];

  return (tree: Node) => {
    visit(
      tree,
      "mdxJsxFlowElement",
      (node: Node, index: number | null, parent: Parent | null) => {
        if (
          isMdxJsxFlowElement(node) &&
          parent &&
          Array.isArray(parent.children) &&
          customComponentNames.includes(node.name)
        ) {
          parent.children.splice(index!, 1);
        }
      }
    );
  };
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*\[[x\s]\]\s+/gm, "")
    .replace(/^\s*>\s+/gm, "");
}

function cleanContentForSearch(content: string): string {
  return stripMarkdown(content)
    .replace(/#{1,6}\s+(.+)/g, "$1")
    .replace(/\|.*\|[\r\n]?/gm, (match) =>
      match
        .split("|")
        .filter((cell) => cell.trim())
        .map((cell) => cell.trim())
        .join(" ")
    )
    .replace(
      /<(?:Note|Card|Step|FileTree|Folder|File|Mermaid)[^>]*>([\s\S]*?)<\/(?:Note|Card|Step|FileTree|Folder|File|Mermaid)>/g,
      "$1"
    )
    .replace(/[^\w\s-:]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function slugifyHeading(heading: string): string {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function extractLines(content: string): SearchIndexLine[] {
  const rawLines = content.split(/\r?\n/);
  const out: SearchIndexLine[] = [];
  let currentAnchor: string | undefined;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      if (level >= 2) currentAnchor = slugifyHeading(headingText);
      out.push({ text: headingText, anchor: currentAnchor });
      continue;
    }

    if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) continue;
    if (trimmed.startsWith("```")) continue;
    if (trimmed.startsWith("|")) continue;
    if (trimmed.startsWith("<") && trimmed.endsWith(">")) continue;

    const stripped = stripMarkdown(trimmed).replace(/\s+/g, " ").trim();
    if (stripped.length < 4) continue;

    out.push({ text: stripped, anchor: currentAnchor });
  }

  return out;
}

interface LegacyDocument {
  slug: string;
  title: string;
  description: string;
  content: string;
  _searchMeta: {
    cleanContent: string;
    headings: string[];
    keywords: string[];
  };
}

async function processMdxFile(
  filePath: string,
  breadcrumbMap: Map<string, { trail: string[]; icon?: string }>,
  docsBySection: Map<string, Paths[]>
): Promise<{ entry: SearchIndexEntry; legacy: LegacyDocument }> {
  const rawMdx = await fs.readFile(filePath, "utf-8");
  const { content, data: frontmatter } = grayMatter(rawMdx);

  const processed = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(removeCustomComponents)
    .use(remarkStringify)
    .process(content);

  const documentContent = String(processed.value);

  const headings =
    documentContent
      .match(/^##\s+(.+)$/gm)
      ?.map((h) => h.replace(/^##\s+/, "").trim()) || [];

  const extractedKeywords = new Set<string>([
    ...(frontmatter.keywords || []),
    ...headings,
    ...(documentContent.match(/\*\*([^*]+)\*\*/g) || []).map((m) =>
      m.replace(/\*\*/g, "").trim()
    ),
    ...(documentContent.match(/`([^`]+)`/g) || []).map((m) =>
      m.replace(/`/g, "").trim()
    ),
  ]);

  const slug = createSlug(filePath);
  const matchedDoc = findDocumentBySlug(slug, docsBySection);
  const title =
    frontmatter.title ||
    (matchedDoc && isRoute(matchedDoc) ? matchedDoc.title : "Untitled");

  const breadcrumbInfo = breadcrumbMap.get(slug) ?? { trail: [] };
  const cleanContent = cleanContentForSearch(documentContent);
  const keywordsArr = Array.from(extractedKeywords);
  const section = sectionForSlug(slug);

  return {
    entry: {
      id: slug,
      slug,
      title,
      description: frontmatter.description || "",
      breadcrumb: breadcrumbInfo.trail,
      icon: breadcrumbInfo.icon,
      section,
      headings,
      keywords: keywordsArr,
      content: cleanContent,
      lines: extractLines(documentContent),
    },
    legacy: {
      slug,
      title,
      description: frontmatter.description || "",
      content: documentContent,
      _searchMeta: {
        cleanContent,
        headings,
        keywords: keywordsArr,
      },
    },
  };
}

async function getMdxFiles(dir: string): Promise<string[]> {
  let files: string[] = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      const subFiles = await getMdxFiles(fullPath);
      files = files.concat(subFiles);
    } else if (item.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function buildSearchData(): Promise<void> {
  try {
    await ensureDirectoryExists(outputDir);

    const docsBySection = await loadSectionDocs();
    const breadcrumbMap = new Map<string, { trail: string[]; icon?: string }>();
    for (const docs of docsBySection.values()) {
      const partial = buildBreadcrumbMap(docs);
      partial.forEach((value, key) => breadcrumbMap.set(key, value));
    }
    // Walk every .mdx under contents/docs. When the same canonical slug
    // exists both rootless and under `default/`, the `default/` copy wins.
    // We achieve that by ordering: rootless files first, default/ last, and
    // deduping the resulting entries by slug — the later occurrence
    // overrides the earlier one.
    const allMdxFiles = await getMdxFiles(docsDir);
    const mdxFiles = [...allMdxFiles].sort((a, b) => {
      const aDefault = path
        .relative(docsDir, a)
        .startsWith(`${DEFAULT_SECTION_DIR}${path.sep}`);
      const bDefault = path
        .relative(docsDir, b)
        .startsWith(`${DEFAULT_SECTION_DIR}${path.sep}`);
      if (aDefault === bDefault) return a.localeCompare(b);
      return aDefault ? 1 : -1;
    });

    const entriesBySlug = new Map<string, SearchIndexEntry>();
    const legacyBySlug = new Map<string, LegacyDocument>();
    for (const file of mdxFiles) {
      const { entry, legacy } = await processMdxFile(
        file,
        breadcrumbMap,
        docsBySection
      );
      if (entriesBySlug.has(entry.slug)) {
        console.warn(
          `[search] duplicate slug ${entry.slug}: ${file} overrides earlier rootless copy`
        );
      }
      entriesBySlug.set(entry.slug, entry);
      legacyBySlug.set(legacy.slug, legacy);
    }
    const entries = Array.from(entriesBySlug.values());
    const legacyDocs = Array.from(legacyBySlug.values());

    const index = buildIndex(entries);
    const indexPath = path.join(outputDir, "index.json");
    await fs.writeFile(indexPath, serializeIndex(index));

    const legacyPath = path.join(outputDir, "documents.json");
    await fs.writeFile(legacyPath, JSON.stringify(legacyDocs, null, 2));

    console.log(
      `[search] indexed ${entries.length} documents → ${path.relative(process.cwd(), indexPath)}`
    );
  } catch (err) {
    console.error("Error processing MDX files:", err);
    process.exitCode = 1;
  }
}

// Auto-run when invoked directly (`tsx src/scripts/content.ts`); skip when
// imported (e.g. by the vite plugin in vite.config.ts).
const invokedDirectly =
  process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  buildSearchData();
}

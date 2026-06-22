import indexedDocumentsData from "../../public/search-data/documents.json";
import searchIndexRaw from "../../public/search-data/index.json?raw";
import defaultDocumentsData from "../contents/settings/documents.json";
import type { Paths } from "../lib/pageroutes";
import { Settings } from "../settings/main";
import {
  defaultSection,
  getSectionFromPath,
  isSectionSlug,
  nonDefaultSections,
  sections,
  visibleSections,
  type SectionConfig,
} from "../settings/sections";
import themeSettings from "../settings/theme";
import {
  filterLinkableRuntimePages,
  normalizeRuntimeHref,
  normalizeRuntimeSlug,
  type DoxaDocsRuntimeSource,
  type RuntimeCompanyConfig,
  type RuntimeFeatureConfig,
  type RuntimeHeading,
  type RuntimeNavNode,
  type RuntimeNavPage,
  type RuntimePage,
  type RuntimePageResolution,
  type RuntimeRawPage,
  type RuntimeSection,
  type RuntimeSiteConfig,
  type RuntimeSocialConfig,
  type RuntimeThemeConfig,
} from "./runtime-source";

interface SourceEntry {
  slug: string;
  href: string;
  filePath: string;
  rawContent: string;
  frontmatter: {
    title: string;
    description: string;
    keywords: string[];
  };
}

interface IndexedDocument {
  slug: string;
  title: string;
  description: string;
  _searchMeta: {
    headings: string[];
    keywords: string[];
  };
}

const mdxSources = import.meta.glob<unknown>(
  "/src/contents/docs/**/index.mdx",
  {
    eager: true,
    import: "default",
    query: "?raw",
  }
);

const DOCS_ROOT_PREFIX = "/src/contents/docs/";
const DEFAULT_SECTION_PREFIX = "default/";

const indexedDocuments = new Map(
  (indexedDocumentsData as IndexedDocument[]).map((document) => [
    normalizeRuntimeHref(document.slug),
    document,
  ])
);

const sectionDocumentsModules = import.meta.glob<Paths[]>(
  "/src/contents/settings/documents.*.json",
  { eager: true, import: "default" }
);

const sourceEntries = buildSourceEntries();

export function createViteRuntimeSource(): DoxaDocsRuntimeSource {
  const source: DoxaDocsRuntimeSource = {
    async getSiteConfig() {
      return {
        name: Settings.site.name,
        description: Settings.site.description,
        url: Settings.site.url,
      } satisfies RuntimeSiteConfig;
    },

    async getCompanyConfig() {
      return { ...Settings.company } satisfies RuntimeCompanyConfig;
    },

    async getSocialConfig() {
      return {
        twitterHandle: Settings.seo.twitterHandle,
        openGraph: Settings.openGraph,
        twitter: Settings.twitter,
      } satisfies RuntimeSocialConfig;
    },

    async getThemeConfig() {
      return { ...themeSettings } satisfies RuntimeThemeConfig;
    },

    async getFeatureConfig() {
      return cloneFeatureConfig(Settings.features);
    },

    async getSections() {
      return sections.map(toRuntimeSection);
    },

    async getNavigation(sectionSlug) {
      return getRuntimeNavigationForSection(sectionSlug);
    },

    async getRoutes(sectionSlug) {
      return getRuntimeRoutesForSection(sectionSlug);
    },

    async getHomeHref() {
      return getHomeHref();
    },

    async resolvePage(pathname) {
      return resolveRuntimePage(pathname, source);
    },

    async getPage(slug) {
      return getRuntimePage(slug);
    },

    async getRawPage(slug) {
      return getRuntimeRawPage(slug);
    },

    async getSearchIndex() {
      return searchIndexRaw.trim() ? searchIndexRaw : null;
    },
  };

  return source;
}

export const viteRuntimeSource = createViteRuntimeSource();

async function resolveRuntimePage(
  pathname: string,
  source: Pick<DoxaDocsRuntimeSource, "getHomeHref" | "getPage">
): Promise<RuntimePageResolution> {
  const href = normalizeRuntimeHref(pathname);
  const slug = normalizeRuntimeSlug(href);

  if (href === "/") {
    const homeHref = await source.getHomeHref();
    if (homeHref) {
      return { type: "redirect", href: homeHref, status: 308 };
    }
  }

  if (slug === "default" || slug.startsWith("default/")) {
    return { type: "not_found", href, slug };
  }

  if (isSectionSlug(slug)) {
    const sectionFirstRoute = getRuntimeRoutesForSection(slug)[0];
    const sectionFirstHref = sectionFirstRoute
      ? normalizeRuntimeHref(sectionFirstRoute.href)
      : null;

    if (sectionFirstHref && sectionFirstHref !== href) {
      return { type: "redirect", href: sectionFirstHref, status: 308 };
    }
  }

  const page = await source.getPage(href);
  if (page) {
    return { type: "page", href: page.href, slug: page.slug, page };
  }

  return { type: "not_found", href, slug };
}

function getHomeHref(): string | null {
  const defaultHome = getRuntimeRoutesForSection(defaultSection.slug)[0]?.href;
  if (defaultHome) return normalizeRuntimeHref(defaultHome);

  const visibleHome = visibleSections
    .map((section) => getRuntimeRoutesForSection(section.slug)[0]?.href)
    .find((href): href is string => typeof href === "string");

  return visibleHome ? normalizeRuntimeHref(visibleHome) : null;
}

function getRuntimePage(input: string): RuntimePage | null {
  const href = normalizeRuntimeHref(input);
  const entry = sourceEntries.get(href);
  if (!entry) return null;

  const indexedDocument = indexedDocuments.get(href) ?? null;
  const route = findRouteForHref(href);

  return {
    slug: entry.slug,
    href: entry.href,
    title:
      entry.frontmatter.title || indexedDocument?.title || route?.title || "",
    description:
      entry.frontmatter.description || indexedDocument?.description || "",
    keywords:
      entry.frontmatter.keywords.length > 0
        ? entry.frontmatter.keywords
        : (indexedDocument?._searchMeta.keywords ?? []),
    sectionSlug: getSectionFromPath(href).slug,
    sourcePath: entry.filePath,
    body: entry.rawContent,
    headings: getRuntimeHeadings(indexedDocument),
  };
}

function getRuntimeRawPage(input: string): RuntimeRawPage | null {
  const href = normalizeRuntimeHref(input);
  const entry = sourceEntries.get(href);
  if (!entry) return null;

  const indexedDocument = indexedDocuments.get(href) ?? null;
  const route = findRouteForHref(href);

  return {
    slug: entry.slug,
    href: entry.href,
    title:
      entry.frontmatter.title || indexedDocument?.title || route?.title || "",
    description:
      entry.frontmatter.description || indexedDocument?.description || "",
    sourcePath: entry.filePath,
    body: entry.rawContent,
  };
}

function getRuntimeHeadings(
  indexedDocument: IndexedDocument | null
): RuntimeHeading[] {
  return (
    indexedDocument?._searchMeta.headings.map((text) => ({
      level: 2,
      text,
      href: `#${innerSlug(text)}`,
    })) ?? []
  );
}

function findRouteForHref(href: string): RuntimeNavPage | null {
  const section = getSectionFromPath(href);
  const route = getRuntimeRoutesForSection(section.slug).find(
    (page) => normalizeRuntimeHref(page.href) === href
  );

  return route ?? null;
}

function buildSourceEntries(): Map<string, SourceEntry> {
  const files = new Map<string, string>();
  const defaultEntries: [string, string][] = [];
  const otherEntries: [string, string][] = [];

  for (const [viteKey, rawModule] of Object.entries(mdxSources)) {
    const source = getRawMdxSource(rawModule, viteKey);
    const relativePath = toRelativePath(viteKey);

    if (relativePath.startsWith(DEFAULT_SECTION_PREFIX)) {
      defaultEntries.push([toCanonicalPath(relativePath), source]);
    } else {
      otherEntries.push([relativePath, source]);
    }
  }

  for (const [filePath, source] of otherEntries) {
    files.set(filePath, source);
  }

  for (const [filePath, source] of defaultEntries) {
    if (!files.has(filePath) || isDefaultSectionPath(filePath)) {
      files.set(filePath, source);
    }
  }

  return new Map(
    Array.from(files.entries()).map(([filePath, rawContent]) => {
      const entry = parseSourceEntry(filePath, rawContent);
      return [entry.href, entry];
    })
  );
}

function parseSourceEntry(filePath: string, rawContent: string): SourceEntry {
  const frontmatter = parseSourceFrontmatter(rawContent);

  return {
    slug: normalizeRuntimeSlug(filePathToHref(filePath)),
    href: filePathToHref(filePath),
    filePath,
    rawContent,
    frontmatter: {
      title: typeof frontmatter.title === "string" ? frontmatter.title : "",
      description:
        typeof frontmatter.description === "string"
          ? frontmatter.description
          : "",
      keywords: parseKeywords(frontmatter.keywords),
    },
  };
}

function getRawMdxSource(value: unknown, viteKey: string): string {
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return new TextDecoder().decode(value);
  if (typeof value === "function") {
    const source = getRawMdxSourceFromComponent(
      value as (...args: unknown[]) => unknown
    );
    if (source) return source;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["default", "__rawSource", "raw", "source"]) {
      if (typeof record[key] === "string") return record[key];
    }
  }

  throw new Error(
    `[vite-runtime-source] Expected raw MDX source string for ${viteKey}.`
  );
}

function getRawMdxSourceFromComponent(
  component: (...args: unknown[]) => unknown
): string | null {
  try {
    return readRawMdxStringFromElement(component({}));
  } catch {
    return null;
  }
}

function readRawMdxStringFromElement(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const element = value as Record<string, unknown>;
  if (typeof element.type === "string" && element.type.startsWith("---")) {
    return element.type;
  }

  const props = element.props;
  if (!props || typeof props !== "object") return null;

  const children = (props as Record<string, unknown>).children;
  return typeof children === "string" && children.startsWith("---")
    ? children
    : null;
}

function parseSourceFrontmatter(rawContent: string): Partial<{
  title: unknown;
  description: unknown;
  keywords: unknown;
}> {
  const block = readFrontmatterBlock(rawContent);
  if (!block) return {};

  const frontmatter: Record<string, unknown> = {};
  const lines = block.split(/\r?\n/);

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) continue;

    let value = match[2]?.trim() ?? "";
    const nextLine = lines[index + 1];
    if (!value && nextLine && /^\s+/.test(nextLine)) {
      value = nextLine.trim();
      index++;
    }

    frontmatter[match[1]] = parseFrontmatterValue(value);
  }

  return frontmatter;
}

function readFrontmatterBlock(rawContent: string): string | null {
  if (!rawContent.startsWith("---")) return null;
  const match = rawContent.match(/^---(?:\r?\n)([\s\S]*?)(?:\r?\n)---/);
  return match?.[1] ?? null;
}

function parseFrontmatterValue(value: string): unknown {
  if (!value) return "";
  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  return stripYamlQuotes(value);
}

function stripYamlQuotes(value: string): string {
  const quote = value[0];
  if (
    (quote === '"' || quote === "'") &&
    value.endsWith(quote) &&
    value.length >= 2
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (keyword): keyword is string => typeof keyword === "string"
    );
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  return [];
}

function toRuntimeSection(section: SectionConfig): RuntimeSection {
  return {
    slug: section.slug,
    label: section.label,
    ...(section.description ? { description: section.description } : {}),
    ...(section.icon ? { icon: section.icon } : {}),
    ...(section.default ? { default: true } : {}),
    ...(section.hidden ? { hidden: true } : {}),
    ...(section.kind ? { kind: section.kind } : {}),
    ...(section.layout ? { layout: section.layout } : {}),
  };
}

export function createRuntimeNavigation(
  nodes: readonly Paths[]
): RuntimeNavNode[] {
  return nodes.map(toRuntimeNavNode);
}

export function createRuntimeRoutes(
  nodes: readonly RuntimeNavNode[]
): RuntimeNavPage[] {
  return filterLinkableRuntimePages(nodes);
}

function getRuntimeNavigationForSection(sectionSlug: string): RuntimeNavNode[] {
  return createRuntimeNavigation(loadSectionDocuments(sectionSlug));
}

function getRuntimeRoutesForSection(sectionSlug: string): RuntimeNavPage[] {
  return createRuntimeRoutes(getRuntimeNavigationForSection(sectionSlug));
}

function loadSectionDocuments(sectionSlug: string): Paths[] {
  if (sectionSlug === defaultSection.slug) {
    return defaultDocumentsData as Paths[];
  }

  const documents = sectionDocumentsModules[
    `/src/contents/settings/documents.${sectionSlug}.json`
  ] as Paths[] | undefined;

  return documents ?? [];
}

function toRuntimeNavNode(node: Paths): RuntimeNavNode {
  if ("spacer" in node) {
    return { spacer: true };
  }

  if ("heading" in node && !("title" in node)) {
    return { heading: node.heading };
  }

  const page: RuntimeNavPage = {
    title: node.title,
    href: normalizeRuntimeHref(node.href),
    ...(node.icon ? { icon: node.icon } : {}),
    ...(node.badge ? { badge: node.badge } : {}),
    ...(node.noLink ? { noLink: true } : {}),
    ...(node.heading ? { heading: node.heading } : {}),
    ...(node.items ? { items: createRuntimeNavigation(node.items) } : {}),
  };

  return page;
}

function cloneFeatureConfig(
  features: typeof Settings.features
): RuntimeFeatureConfig {
  return {
    branding: features.branding,
    rightSidebar: features.rightSidebar,
    feedbackEdit: features.feedbackEdit,
    tableOfContents: features.tableOfContents,
    scrollToTop: features.scrollToTop,
    ai: { ...features.ai },
    copyPage: { ...features.copyPage },
    rawMarkdown: features.rawMarkdown,
    loadFromGithub: features.loadFromGithub,
  };
}

function toRelativePath(viteKey: string): string {
  return viteKey.startsWith(DOCS_ROOT_PREFIX)
    ? viteKey.slice(DOCS_ROOT_PREFIX.length)
    : viteKey;
}

function toCanonicalPath(relativePath: string): string {
  return relativePath.startsWith(DEFAULT_SECTION_PREFIX)
    ? relativePath.slice(DEFAULT_SECTION_PREFIX.length)
    : relativePath;
}

function isDefaultSectionPath(canonicalPath: string): boolean {
  const firstSegment = canonicalPath.split("/", 1)[0];
  return !nonDefaultSections.some((section) => section.slug === firstSegment);
}

function filePathToHref(filePath: string): string {
  return normalizeRuntimeHref(
    filePath.replace(/\/index\.mdx$/, "").replace(/\.mdx$/, "")
  );
}

function innerSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, "");
}

import {
  filterLinkableRuntimePages,
  flattenRuntimeNavigation,
  getRuntimeSectionFromHref,
  normalizeRuntimeHref,
  normalizeRuntimeSlug,
  type DoxaDocsRuntimeSource,
  type RuntimeFeatureConfig,
  type RuntimeHeading,
  type RuntimeNavNode,
  type RuntimeNavPage,
  type RuntimePage,
  type RuntimeRawPage,
  type RuntimeSection,
  type RuntimeSiteConfig,
} from "./runtime-source";

type RuntimeRedirectStatus = 301 | 302 | 303 | 307 | 308;

export interface DocsRouteDocument {
  slug: string;
  href: string;
  sourcePath: string;
  frontmatter: {
    title: string;
    description: string;
    keywords: string;
  };
  tocs: RuntimeHeading[];
  lastUpdated: null;
}

export interface DocsRouteRawDocument {
  body: string;
  title: string;
  description: string;
}

export interface DocsRouteRedirectData {
  type: "redirect";
  href: string;
  status: RuntimeRedirectStatus;
}

export interface DocsRouteRouterNotFoundData {
  type: "router_not_found";
  href: string;
  slug: string;
}

export interface DocsRoutePageData {
  type: "page" | "not_found";
  slug: string;
  href: string;
  homeHref: string | null;
  canonicalUrl: string;
  site: RuntimeSiteConfig;
  features: RuntimeFeatureConfig;
  sections: RuntimeSection[];
  visibleSections: RuntimeSection[];
  currentSection: RuntimeSection | null;
  sectionHomeHrefs: Record<string, string>;
  sectionNavigation: RuntimeNavNode[];
  sectionRoutes: RuntimeNavPage[];
  routeTitle: string | null;
  sectionHeading: string | null;
  previous: RuntimeNavPage | null;
  next: RuntimeNavPage | null;
  document: DocsRouteDocument | null;
  rawDoc: DocsRouteRawDocument | null;
}

export type DocsRouteData =
  | DocsRouteRedirectData
  | DocsRouteRouterNotFoundData
  | DocsRoutePageData;

export interface ResolveDocsRouteDataOptions {
  includeRawDocument?: boolean;
}

export async function resolveDocsRouteData(
  source: DoxaDocsRuntimeSource,
  pathname: string,
  options: ResolveDocsRouteDataOptions = {}
): Promise<DocsRouteData> {
  const includeRawDocument = options.includeRawDocument ?? true;
  const resolution = await source.resolvePage(pathname);

  if (resolution.type === "redirect") {
    return {
      type: "redirect",
      href: normalizeRuntimeHref(resolution.href),
      status: resolution.status,
    };
  }

  if (
    resolution.type === "not_found" &&
    isDefaultPrefixedSlug(resolution.slug)
  ) {
    return {
      type: "router_not_found",
      href: resolution.href,
      slug: resolution.slug,
    };
  }

  const site = await source.getSiteConfig();
  const features = await source.getFeatureConfig();
  const sections = await source.getSections();
  const homeHref = await source.getHomeHref();
  const href =
    resolution.type === "page"
      ? normalizeRuntimeHref(resolution.href)
      : normalizeRuntimeHref(resolution.href);
  const slug =
    resolution.type === "page" ? resolution.slug : normalizeRuntimeSlug(href);
  const currentSection = getRuntimeSectionFromHref(sections, href);
  const sectionSlug = currentSection?.slug ?? "";
  const sectionNavigation = sectionSlug
    ? await source.getNavigation(sectionSlug)
    : [];
  const sectionRoutes = sectionSlug ? await source.getRoutes(sectionSlug) : [];
  const sectionHomeHrefs = await getSectionHomeHrefs(source, sections);
  const routeTitle =
    sectionRoutes.find((route) => normalizeRuntimeHref(route.href) === href)
      ?.title ?? null;
  const sectionHeading =
    findSectionHeadingFromRuntimeNavigation(sectionNavigation, href) ?? null;
  const { previous, next } = getPreviousNextFromRuntimeRoutes(
    sectionRoutes,
    href
  );
  const page = resolution.type === "page" ? resolution.page : null;
  const document = page ? toDocsRouteDocument(page) : null;
  const rawDoc =
    page && includeRawDocument && features.copyPage.markdown
      ? await getDocsRouteRawDocument(source, page.href)
      : null;

  return {
    type: page ? "page" : "not_found",
    slug,
    href,
    homeHref,
    canonicalUrl: getCanonicalUrl(site.url, href),
    site,
    features,
    sections,
    visibleSections: sections.filter((section) => !section.hidden),
    currentSection,
    sectionHomeHrefs,
    sectionNavigation,
    sectionRoutes,
    routeTitle,
    sectionHeading,
    previous,
    next,
    document,
    rawDoc,
  };
}

export async function resolveDocsRootRouteData(
  source: DoxaDocsRuntimeSource
): Promise<DocsRouteRedirectData | { type: "empty"; homeHref: null }> {
  const resolution = await source.resolvePage("/");

  if (resolution.type === "redirect") {
    return {
      type: "redirect",
      href: normalizeRuntimeHref(resolution.href),
      status: resolution.status,
    };
  }

  const homeHref = await source.getHomeHref();
  if (homeHref) {
    return {
      type: "redirect",
      href: normalizeRuntimeHref(homeHref),
      status: 308,
    };
  }

  return { type: "empty", homeHref: null };
}

export async function getDocsRouteRawDocument(
  source: Pick<DoxaDocsRuntimeSource, "getRawPage">,
  slugOrHref: string
): Promise<DocsRouteRawDocument | null> {
  const rawPage = await source.getRawPage(slugOrHref);
  return rawPage ? toCopyPageRawDocument(rawPage) : null;
}

export function findSectionHeadingFromRuntimeNavigation(
  navigation: readonly RuntimeNavNode[],
  href: string
): string | undefined {
  const targetHref = normalizeRuntimeHref(href);
  let currentHeading: string | undefined;

  for (const node of flattenRuntimeNavigation(navigation)) {
    if (isRuntimeNavHeading(node)) {
      currentHeading = node.heading;
    } else if (
      isRuntimeNavPage(node) &&
      normalizeRuntimeHref(node.href) === targetHref
    ) {
      return currentHeading;
    }
  }

  return undefined;
}

export function getPreviousNextFromRuntimeRoutes(
  routes: readonly RuntimeNavPage[],
  href: string
): { previous: RuntimeNavPage | null; next: RuntimeNavPage | null } {
  const targetHref = normalizeRuntimeHref(href);
  const pages = filterLinkableRuntimePages(routes);
  const index = pages.findIndex(
    (route) => normalizeRuntimeHref(route.href) === targetHref
  );

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? pages[index - 1] : null,
    next: index < pages.length - 1 ? pages[index + 1] : null,
  };
}

async function getSectionHomeHrefs(
  source: DoxaDocsRuntimeSource,
  sections: readonly RuntimeSection[]
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    sections
      .filter((section) => !section.hidden)
      .map(async (section) => {
        const routes = await source.getRoutes(section.slug);
        const href = routes[0]?.href;
        return href
          ? ([section.slug, normalizeRuntimeHref(href)] as const)
          : null;
      })
  );

  return Object.fromEntries(entries.filter(isSectionHomeHrefEntry));
}

function isSectionHomeHrefEntry(
  entry: readonly [string, string] | null
): entry is readonly [string, string] {
  return entry !== null;
}

function toDocsRouteDocument(page: RuntimePage): DocsRouteDocument {
  return {
    slug: page.slug,
    href: page.href,
    sourcePath: page.sourcePath,
    frontmatter: {
      title: page.title,
      description: page.description,
      keywords: page.keywords.join(", "),
    },
    tocs: page.headings,
    lastUpdated: null,
  };
}

function toCopyPageRawDocument(page: RuntimeRawPage): DocsRouteRawDocument {
  return {
    title: page.title,
    description: page.description,
    body: stripFrontmatter(page.body),
  };
}

function stripFrontmatter(source: unknown): string {
  if (typeof source !== "string") return "";
  if (!source.startsWith("---")) return source;

  const match = source.match(/^---(?:\r?\n)[\s\S]*?(?:\r?\n)---(?:\r?\n|$)/);
  return match ? source.slice(match[0].length) : source;
}

function getCanonicalUrl(siteUrl: string, href: string): string {
  const base = siteUrl.replace(/\/+$/, "");
  const normalizedHref = normalizeRuntimeHref(href);
  return normalizedHref === "/" ? base || "/" : `${base}${normalizedHref}`;
}

function isDefaultPrefixedSlug(slug: string): boolean {
  return slug === "default" || slug.startsWith("default/");
}

function isRuntimeNavHeading(
  node: RuntimeNavNode
): node is Extract<RuntimeNavNode, { heading: string }> {
  return "heading" in node && !("title" in node);
}

function isRuntimeNavPage(node: RuntimeNavNode): node is RuntimeNavPage {
  return "title" in node && "href" in node;
}

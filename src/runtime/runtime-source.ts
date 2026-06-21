import type { ColorPreset } from "../lib/colors";
import type { ThemeName } from "../lib/themes";
import type { IconName } from "../settings/icons";
import type { OpenGraph, TwitterCard } from "../types/opengraph";
import type { RuntimeSiteConfig } from "./site-config";

export type { RuntimeSiteConfig } from "./site-config";

export interface RuntimeCompanyConfig {
  name: string;
  link: string;
}

export interface RuntimeSocialConfig {
  twitterHandle: string;
  openGraph: OpenGraph;
  twitter: TwitterCard;
}

export interface RuntimeThemeConfig {
  primaryColor: ColorPreset;
  activeTheme: ThemeName;
}

export interface RuntimeFeatureConfig {
  branding: boolean;
  rightSidebar: boolean;
  feedbackEdit: boolean;
  tableOfContents: boolean;
  scrollToTop: boolean;
  ai: {
    chat: boolean;
    chatWithPage: boolean;
    floatingInput: boolean;
  };
  copyPage: {
    markdown: boolean;
    rawText: boolean;
  };
  rawMarkdown: boolean;
  loadFromGithub: boolean;
}

export interface RuntimeSection {
  slug: string;
  label: string;
  description?: string;
  icon?: IconName;
  default?: boolean;
  hidden?: boolean;
  kind?: "documentation" | "reference" | "development";
  layout?: "docs" | "reference";
}

export interface RuntimeNavPage {
  title: string;
  href: string;
  icon?: IconName;
  badge?: string;
  noLink?: true;
  heading?: string;
  items?: RuntimeNavNode[];
}

export interface RuntimeNavHeading {
  heading: string;
}

export interface RuntimeNavSpacer {
  spacer: true;
}

export type RuntimeNavNode =
  | RuntimeNavPage
  | RuntimeNavHeading
  | RuntimeNavSpacer;

export interface RuntimeHeading {
  level: number;
  text: string;
  href: string;
}

export interface RuntimePage {
  slug: string;
  href: string;
  title: string;
  description: string;
  keywords: string[];
  sectionSlug: string;
  sourcePath: string;
  body: string;
  headings: RuntimeHeading[];
}

export interface RuntimeRawPage {
  slug: string;
  href: string;
  title: string;
  description: string;
  sourcePath: string;
  body: string;
}

export type RuntimePageResolution =
  | {
      type: "page";
      href: string;
      slug: string;
      page: RuntimePage;
    }
  | {
      type: "redirect";
      href: string;
      status: 301 | 302 | 303 | 307 | 308;
    }
  | {
      type: "not_found";
      href: string;
      slug: string;
    };

export interface DoxaDocsRuntimeSource {
  getSiteConfig(): Promise<RuntimeSiteConfig>;
  getCompanyConfig(): Promise<RuntimeCompanyConfig>;
  getSocialConfig(): Promise<RuntimeSocialConfig>;
  getThemeConfig(): Promise<RuntimeThemeConfig>;
  getFeatureConfig(): Promise<RuntimeFeatureConfig>;
  getSections(): Promise<RuntimeSection[]>;
  getNavigation(sectionSlug: string): Promise<RuntimeNavNode[]>;
  getRoutes(sectionSlug: string): Promise<RuntimeNavPage[]>;
  getHomeHref(): Promise<string | null>;
  resolvePage(pathname: string): Promise<RuntimePageResolution>;
  getPage(slug: string): Promise<RuntimePage | null>;
  getRawPage(slug: string): Promise<RuntimeRawPage | null>;
  getSearchIndex(): Promise<string | null>;
}

export function normalizeRuntimeHref(value: string): string {
  const clean = value
    .trim()
    .split(/[?#]/, 1)[0]
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/(?:^|\/)index(?:\.mdx?)?$/i, "");

  const normalized = clean.replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized ? `/${normalized}` : "/";
}

export function normalizeRuntimeSlug(value: string): string {
  const href = normalizeRuntimeHref(value);
  return href === "/" ? "" : href.slice(1);
}

export function normalizeRuntimeBasePath(value?: string | null): string {
  if (!value) return "";
  const clean = value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  return clean ? `/${clean}` : "";
}

export function getRuntimeDefaultSection(
  sections: readonly RuntimeSection[]
): RuntimeSection | null {
  return sections.find((section) => section.default) ?? null;
}

export function getRuntimeSectionFromHref(
  sections: readonly RuntimeSection[],
  href: string
): RuntimeSection | null {
  const normalizedHref = normalizeRuntimeHref(href);
  const firstSegment = normalizedHref.split("/").filter(Boolean)[0];
  const prefixedSection = sections.find(
    (section) => !section.default && section.slug === firstSegment
  );

  return prefixedSection ?? getRuntimeDefaultSection(sections);
}

export function flattenRuntimeNavigation(
  nodes: readonly RuntimeNavNode[],
  parentHref = ""
): RuntimeNavNode[] {
  const flattened: RuntimeNavNode[] = [];

  for (const node of nodes) {
    if (isRuntimeNavPage(node)) {
      const href = joinRuntimeHrefs(parentHref, node.href);
      const { items, ...page } = node;
      flattened.push({ ...page, href });

      if (items) {
        flattened.push(...flattenRuntimeNavigation(items, href));
      }
    } else {
      flattened.push({ ...node });
    }
  }

  return flattened;
}

export function filterLinkableRuntimePages(
  nodes: readonly RuntimeNavNode[]
): RuntimeNavPage[] {
  return flattenRuntimeNavigation(nodes).filter(
    (node): node is RuntimeNavPage => isRuntimeNavPage(node) && !node.noLink
  );
}

function joinRuntimeHrefs(parentHref: string, href: string): string {
  const parent = normalizeRuntimeHref(parentHref);
  const child = normalizeRuntimeHref(href);

  if (parent === "/") return child;
  if (child === "/") return parent;
  return normalizeRuntimeHref(`${parent}${child}`);
}

function isRuntimeNavPage(node: RuntimeNavNode): node is RuntimeNavPage {
  return "title" in node && "href" in node;
}

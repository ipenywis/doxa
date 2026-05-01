import DefaultDocs from "@/src/contents/settings/documents.json";

import type { IconName } from "@/src/settings/icons";
import { defaultSection, nonDefaultSections } from "@/src/settings/sections";

export type Paths =
  | {
      title: string;
      href: string;
      icon?: IconName;
      noLink?: true;
      heading?: string;
      /**
       * Nesting is temporarily disabled in the sidebar.
       * Items are kept in the type for backward compatibility.
       */
      items?: Paths[];
    }
  | {
      heading: string;
    }
  | {
      spacer: true;
    };

export interface Page {
  title: string;
  href: string;
  icon?: IconName;
}

function flattenRoutes(routes: Paths[], parentHref = ""): Paths[] {
  const result: Paths[] = [];
  for (const route of routes) {
    if ("title" in route && "href" in route) {
      const fullHref = parentHref + route.href;
      result.push({ ...route, href: fullHref });
      if (route.items) {
        result.push(...flattenRoutes(route.items, fullHref));
      }
    } else {
      result.push(route);
    }
  }
  return result;
}

// Per-section nav files, statically bundled. Each file lives at
// src/contents/settings/documents.<slug>.json and is consumed when the user
// is on a path scoped to that section.
const sectionDocsModules = import.meta.glob<Paths[]>(
  "/src/contents/settings/documents.*.json",
  { eager: true, import: "default" }
);

function loadSectionDocs(slug: string): Paths[] {
  const docs = sectionDocsModules[
    `/src/contents/settings/documents.${slug}.json`
  ] as Paths[] | undefined;
  return docs ?? [];
}

const sectionRoutes: Record<string, Paths[]> = {
  [defaultSection.slug]: flattenRoutes(DefaultDocs as Paths[]),
};
for (const section of nonDefaultSections) {
  sectionRoutes[section.slug] = flattenRoutes(loadSectionDocs(section.slug));
}

export function isRoute(
  node: Paths
): node is Extract<Paths, { title: string; href: string }> {
  return "title" in node && "href" in node;
}

export function isHeading(
  node: Paths
): node is Extract<Paths, { heading: string }> {
  return "heading" in node && !("title" in node);
}

function asPageRoutes(routes: Paths[]): Page[] {
  return routes
    .filter(isRoute)
    .filter((node) => !node.noLink)
    .map((node) => ({
      title: node.title,
      href: node.href,
      ...(node.icon ? { icon: node.icon } : {}),
    }));
}

const sectionPageRoutes: Record<string, Page[]> = Object.fromEntries(
  Object.entries(sectionRoutes).map(([slug, routes]) => [
    slug,
    asPageRoutes(routes),
  ])
);

export function getRoutesForSection(slug: string): Paths[] {
  return sectionRoutes[slug] ?? [];
}

export function getPageRoutesForSection(slug: string): Page[] {
  return sectionPageRoutes[slug] ?? [];
}

// Back-compat exports — point at the default section.
export const Routes: Paths[] = sectionRoutes[defaultSection.slug];
export const PageRoutes: Page[] = sectionPageRoutes[defaultSection.slug];

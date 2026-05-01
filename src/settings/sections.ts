/**
 * Sections — Top-level docs surfaces (Documentation, API Reference, Development, …).
 *
 * Exactly one section must be marked `default: true`. The default section is
 * "rootless": its pages live at `/docs/<slug>` and its content sits at the
 * root of `src/contents/docs/`. Non-default sections own a top-level folder
 * named after their slug — `src/contents/docs/<slug>/...` — and their URLs
 * are `/docs/<slug>/...`.
 *
 * Edit the `sections` array to add / rename / reorder sections.
 */

import type { IconName } from "@/src/settings/icons";

export interface SectionConfig {
  /**
   * URL prefix and folder name for non-default sections; identifier-only for the default.
   * Must be kebab-case (a-z, 0-9, hyphens), starting with a letter.
   */
  slug: string;
  /** Tab label shown in the navbar. */
  label: string;
  /** Optional short description (reserved for SEO / future tooltips). */
  description?: string;
  /** Optional icon (key in `iconMap`) — reserved for future per-tab adornment. */
  icon?: IconName;
  /** Exactly one section must set this to true. The default has no URL prefix. */
  default?: boolean;
  /** Hide the tab without removing the section from disk. */
  hidden?: boolean;
}

const KEBAB_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const sections: readonly SectionConfig[] = [
  {
    slug: "documentation",
    label: "Documentation",
    default: true,
  },
  {
    slug: "development",
    label: "Development",
    icon: "wrench",
    description:
      "Set up the Doxa template locally, learn the codebase, and contribute changes.",
  },
];

function validateSections(list: readonly SectionConfig[]): void {
  if (list.length === 0) {
    throw new Error("[sections] At least one section is required.");
  }

  const defaults = list.filter((s) => s.default);
  if (defaults.length === 0) {
    throw new Error("[sections] Exactly one section must set `default: true`.");
  }
  if (defaults.length > 1) {
    throw new Error(
      `[sections] Only one section may set \`default: true\`. Found ${defaults.length}: ${defaults.map((s) => s.slug).join(", ")}.`
    );
  }

  const seen = new Set<string>();
  for (const s of list) {
    if (!KEBAB_RE.test(s.slug)) {
      throw new Error(
        `[sections] Slug "${s.slug}" is not kebab-case. Use lowercase letters, digits, and hyphens (must start with a letter).`
      );
    }
    if (seen.has(s.slug)) {
      throw new Error(`[sections] Duplicate section slug "${s.slug}".`);
    }
    seen.add(s.slug);

    if (!s.label.trim()) {
      throw new Error(
        `[sections] Section "${s.slug}" must have a non-empty label.`
      );
    }
  }
}

validateSections(sections);

export const defaultSection: SectionConfig = sections.find(
  (s) => s.default
) as SectionConfig;

export const nonDefaultSections: readonly SectionConfig[] = sections.filter(
  (s) => !s.default
);

export function getSectionBySlug(slug: string): SectionConfig | undefined {
  return sections.find((s) => s.slug === slug);
}

/** True if the slug names a non-default section (i.e. owns a URL prefix). */
export function isSectionSlug(slug: string): boolean {
  return nonDefaultSections.some((s) => s.slug === slug);
}

/**
 * Resolve a section from a pathname.
 * `/docs/<x>/...` → if `<x>` is a non-default slug, returns that section.
 * Otherwise returns the default section.
 */
export function getSectionFromPath(pathname: string): SectionConfig {
  const match = pathname.match(/^\/docs\/?([^/]+)?/);
  const first = match?.[1];
  if (first && isSectionSlug(first)) {
    return getSectionBySlug(first) ?? defaultSection;
  }
  return defaultSection;
}

/** URL prefix for a section: `""` for default, `"/<slug>"` otherwise. */
export function getSectionPrefix(section: SectionConfig): string {
  return section.default ? "" : `/${section.slug}`;
}

/** Sections visible in the tab bar (excludes hidden ones). */
export const visibleSections: readonly SectionConfig[] = sections.filter(
  (s) => !s.hidden
);

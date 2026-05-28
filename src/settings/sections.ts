/**
 * Sections — Top-level docs surfaces (Documentation, API Reference, Development, …).
 *
 * The canonical section list lives at `src/contents/settings/sections.json`,
 * keeping it in the same shape and folder as `documents.json` and
 * `theme.json`. This module is a thin loader: it imports the JSON,
 * validates it once at module init, and exposes the public API every
 * consumer (router, sidebar, content adapters, search) already uses.
 *
 * Exactly one section must be marked `default: true`. The default section
 * is "rootless": its pages live at `/<slug>` (no URL prefix). Non-default
 * sections own a URL prefix matching their slug — `/<slug>/...`.
 *
 * On-disk layout (default-section content):
 *   - Canonical: `src/contents/docs/default/<page>/index.mdx` (the layout
 *     written by the Doxa CLI's docs generator).
 *   - Legacy fallback: `src/contents/docs/<page>/index.mdx` (older sites
 *     and hand-authored content). Both layouts resolve to the same URL —
 *     the content adapters (vite / github) and the content-build script
 *     transparently strip the `default/` prefix when building canonical
 *     paths, and the canonical layout wins when both exist for the same
 *     page.
 *
 * Non-default section content always lives under `src/contents/docs/<slug>/`.
 *
 * Edit `sections.json` to add / rename / reorder sections.
 */

import sectionsData from "@/src/contents/settings/sections.json" with { type: "json" };

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
  /** Optional behavior hint for section-specific rendering. */
  kind?: "documentation" | "reference" | "development";
  /** Optional layout hint for section-specific rendering. */
  layout?: "docs" | "reference";
}

const KEBAB_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const sections: readonly SectionConfig[] =
  sectionsData as readonly SectionConfig[];

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
 * `/<x>/...` → if `<x>` is a non-default slug, returns that section.
 * Otherwise returns the default section.
 */
export function getSectionFromPath(pathname: string): SectionConfig {
  const match = pathname.match(/^\/?([^/]+)?/);
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

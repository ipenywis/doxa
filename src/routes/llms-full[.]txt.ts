/**
 * /llms-full.txt — Full documentation corpus as a single plain-text file.
 *
 * Concatenates all doc pages into one document consumable by external AI
 * assistants as a single-file knowledge dump. Each section prefixed with
 * its source URL for citation. Follows the llms-full.txt convention.
 *
 * When more than one section is configured, entries are grouped by section
 * with a leading section header so the section context is preserved.
 */

import { createFileRoute } from "@tanstack/react-router";

import { Settings } from "@/src/settings/main";
import {
  defaultSection,
  isSectionSlug,
  nonDefaultSections,
  sections,
} from "@/src/settings/sections";
import { contentStore, filePathToSlug } from "@/src/lib/content/store";
import type { ContentEntry } from "@/src/lib/content/types";

function sectionForSlug(slug: string): string {
  const first = slug.split("/").filter(Boolean)[0];
  if (first && isSectionSlug(first)) return first;
  return defaultSection.slug;
}

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: async () => {
        const entries = await contentStore.getAllEntries();
        const sorted = entries
          .slice()
          .sort((a, b) => a.slug.localeCompare(b.slug));

        const grouped = new Map<string, ContentEntry[]>();
        for (const entry of sorted) {
          const slug = sectionForSlug(entry.slug);
          const list = grouped.get(slug) ?? [];
          list.push(entry);
          grouped.set(slug, list);
        }

        const out: string[] = [];
        out.push(`# ${Settings.site.name}`);
        out.push("");
        out.push(`> ${Settings.site.description}`);
        out.push("");

        const groupBySection = nonDefaultSections.length > 0;
        const orderedSections = groupBySection ? sections : [defaultSection];

        for (const section of orderedSections) {
          const list = grouped.get(section.slug);
          if (!list || list.length === 0) continue;

          if (groupBySection) {
            out.push(`# ${section.label}`);
            out.push("");
          }

          for (const entry of list) {
            const title =
              entry.frontmatter.title || filePathToSlug(entry.filePath);
            const url = `${Settings.site.url}${entry.slug}`;
            out.push("---");
            out.push("");
            out.push(`## ${title}`);
            out.push(`Source: ${url}`);
            out.push("");
            out.push(entry.body.trim());
            out.push("");
          }
        }

        return new Response(out.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

/**
 * /llms.txt — AI-native page index.
 *
 * Plain-text index of all documentation pages following the llms.txt
 * convention (https://llmstxt.org/). Consumed by external AI tools
 * (ChatGPT, Claude, Cursor, MCP clients) for discovery and citation.
 *
 * Entries are grouped by section when more than one section is configured.
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

export const Route = createFileRoute("/llms.txt")({
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

        const lines: string[] = [];
        lines.push(`# ${Settings.site.name}`);
        lines.push("");
        lines.push(`> ${Settings.site.description}`);
        lines.push("");

        const groupBySection = nonDefaultSections.length > 0;

        if (!groupBySection) {
          lines.push("## Docs");
          lines.push("");
          for (const entry of grouped.get(defaultSection.slug) ?? []) {
            lines.push(formatEntry(entry));
          }
        } else {
          for (const section of sections) {
            const list = grouped.get(section.slug);
            if (!list || list.length === 0) continue;
            lines.push(`## ${section.label}`);
            lines.push("");
            for (const entry of list) {
              lines.push(formatEntry(entry));
            }
            lines.push("");
          }
        }

        return new Response(lines.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

function formatEntry(entry: ContentEntry): string {
  const title = entry.frontmatter.title || filePathToSlug(entry.filePath);
  const description = entry.frontmatter.description;
  const url = `${Settings.site.url}${entry.slug}`;
  const desc = description ? `: ${description}` : "";
  return `- [${title}](${url})${desc}`;
}

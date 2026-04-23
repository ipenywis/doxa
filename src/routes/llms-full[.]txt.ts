/**
 * /llms-full.txt — Full documentation corpus as a single plain-text file.
 *
 * Concatenates all doc pages into one document consumable by external AI
 * assistants as a single-file knowledge dump. Each section prefixed with
 * its source URL for citation. Follows the llms-full.txt convention.
 */

import { createFileRoute } from "@tanstack/react-router";

import { Settings } from "@/src/settings/main";
import { contentStore, filePathToSlug } from "@/src/lib/content/store";

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: async () => {
        const entries = await contentStore.getAllEntries();
        const sorted = entries
          .slice()
          .sort((a, b) => a.slug.localeCompare(b.slug));

        const sections: string[] = [];
        sections.push(`# ${Settings.site.name}`);
        sections.push("");
        sections.push(`> ${Settings.site.description}`);
        sections.push("");

        for (const entry of sorted) {
          const title =
            entry.frontmatter.title || filePathToSlug(entry.filePath);
          const url = `${Settings.site.url}/docs${entry.slug}`;
          sections.push("---");
          sections.push("");
          sections.push(`## ${title}`);
          sections.push(`Source: ${url}`);
          sections.push("");
          sections.push(entry.body.trim());
          sections.push("");
        }

        return new Response(sections.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

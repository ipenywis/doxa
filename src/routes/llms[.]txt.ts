/**
 * /llms.txt — AI-native page index.
 *
 * Plain-text index of all documentation pages following the llms.txt
 * convention (https://llmstxt.org/). Consumed by external AI tools
 * (ChatGPT, Claude, Cursor, MCP clients) for discovery and citation.
 */

import { createFileRoute } from "@tanstack/react-router"

import { contentStore, filePathToSlug } from "@/src/lib/content/store"
import { Settings } from "@/src/settings/main"

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const entries = await contentStore.getAllEntries()
        const sorted = entries.slice().sort((a, b) => a.slug.localeCompare(b.slug))

        const lines: string[] = []
        lines.push(`# ${Settings.site.name}`)
        lines.push("")
        lines.push(`> ${Settings.site.description}`)
        lines.push("")
        lines.push("## Docs")
        lines.push("")

        for (const entry of sorted) {
          const title = entry.frontmatter.title || filePathToSlug(entry.filePath)
          const description = entry.frontmatter.description
          const url = `${Settings.site.url}/docs${entry.slug}`
          const desc = description ? `: ${description}` : ""
          lines.push(`- [${title}](${url})${desc}`)
        }

        return new Response(lines.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        })
      },
    },
  },
})

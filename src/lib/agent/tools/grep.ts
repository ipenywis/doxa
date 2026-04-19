/**
 * grep — Search documentation for a pattern.
 *
 * Regex search across all MDX content via the ContentStore. Edge-compatible —
 * no filesystem access, no subprocess. Returns matching lines with file paths
 * and line numbers.
 */

import { toolDefinition } from "@tanstack/ai"

import { contentStore } from "@/src/lib/content/store"

const MAX_OUTPUT_LINES = 150

const grepToolDefinition = toolDefinition({
  name: "grep",
  description:
    "Search file contents for a pattern. Searches through all documentation files and returns matching lines with file paths and line numbers. Paths are relative to the docs root.",
  inputSchema: {
    type: "object" as const,
    properties: {
      pattern: {
        type: "string" as const,
        description:
          "The search pattern (regex or literal). Example: installation, getting started, import",
      },
      path: {
        type: "string" as const,
        description:
          "File or directory to search in, relative to docs root. Defaults to the entire docs directory. Example: basic-setup",
      },
      include: {
        type: "string" as const,
        description:
          'File glob to filter (kept for interface compatibility; all indexed files are .mdx). Example: *.mdx',
      },
    },
    required: ["pattern"] as const,
  },
})

function compilePattern(pattern: string): RegExp {
  try {
    return new RegExp(pattern, "i")
  } catch {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return new RegExp(escaped, "i")
  }
}

async function executeGrep(args: {
  pattern: string
  path?: string
  include?: string
}): Promise<string> {
  const pattern = args?.pattern
  if (typeof pattern !== "string" || !pattern.trim()) {
    return "Error: missing search pattern"
  }

  const regex = compilePattern(pattern)

  try {
    const matches = await contentStore.searchContent(regex, args.path)
    if (matches.length === 0) return "No matches found."

    const lines = matches.map((m) => `${m.filePath}:${m.lineNumber}:${m.line}`)
    if (lines.length > MAX_OUTPUT_LINES) {
      return (
        lines.slice(0, MAX_OUTPUT_LINES).join("\n") +
        `\n\n... (${lines.length - MAX_OUTPUT_LINES} more matches)`
      )
    }

    return lines.join("\n")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `Error: ${message}`
  }
}

export const grepTool = grepToolDefinition.server((args: unknown) =>
  executeGrep(args as { pattern: string; path?: string; include?: string })
)

/**
 * cat — Read a documentation file.
 *
 * Returns raw MDX content via the ContentStore. Edge-compatible — no
 * filesystem access. Output includes frontmatter and original component
 * markup so the agent sees the same content as the source file.
 */

import { toolDefinition } from "@tanstack/ai"

import { contentStore } from "@/src/lib/content/store"

const MAX_OUTPUT_CHARS = 30_000

const catToolDefinition = toolDefinition({
  name: "cat",
  description:
    "Read and display the contents of a file. Paths are relative to the docs root directory. Example: cat getting-started/index.mdx",
  inputSchema: {
    type: "object" as const,
    properties: {
      file: {
        type: "string" as const,
        description:
          "Path to the file to read, relative to the docs root. Example: basic-setup/index.mdx",
      },
    },
    required: ["file"] as const,
  },
})

async function executeCat(args: { file: string }): Promise<string> {
  const file = args?.file
  if (typeof file !== "string" || !file.trim()) {
    return "Error: missing file path"
  }

  try {
    const content = await contentStore.readRaw(file)
    if (content === null) return `Error: file not found: ${file}`

    if (content.length > MAX_OUTPUT_CHARS) {
      return (
        content.slice(0, MAX_OUTPUT_CHARS) +
        `\n\n... (truncated at ${MAX_OUTPUT_CHARS} characters)`
      )
    }
    return content
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `Error: ${message}`
  }
}

export const catTool = catToolDefinition.server((args: unknown) =>
  executeCat(args as { file: string })
)

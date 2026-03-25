/**
 * cat — Read file contents.
 *
 * Reads and returns the full contents of a file.
 * All paths are relative to the docs root directory.
 */

import { readFile } from "fs/promises"
import { toolDefinition } from "@tanstack/ai"
import { resolveSandboxed } from "@/src/lib/agent/tools/sandbox"

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

  const resolved = resolveSandboxed(file)
  if (!resolved) {
    return `Error: path not allowed: ${file}`
  }

  try {
    const content = await readFile(resolved, "utf-8")
    if (content.length > MAX_OUTPUT_CHARS) {
      return (
        content.slice(0, MAX_OUTPUT_CHARS) +
        `\n\n... (truncated at ${MAX_OUTPUT_CHARS} characters)`
      )
    }
    return content
  } catch {
    return `Error: file not found: ${file}`
  }
}

export const catTool = catToolDefinition.server(
  (args: unknown) => executeCat(args as { file: string })
)

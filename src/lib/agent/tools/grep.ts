/**
 * grep — Search file contents for a pattern.
 *
 * Recursively searches documentation files for a regex pattern.
 * Returns matching lines with file paths and line numbers.
 * All paths are relative to the docs root directory.
 */

import { execFile } from "child_process"
import { toolDefinition } from "@tanstack/ai"
import { getDocsRoot, resolveSandboxed } from "@/src/lib/agent/tools/sandbox"

const MAX_OUTPUT_LINES = 150
const EXEC_TIMEOUT_MS = 10_000

const grepToolDefinition = toolDefinition({
  name: "grep",
  description:
    "Search file contents for a pattern. Searches recursively through documentation files and returns matching lines with file paths and line numbers. Paths are relative to the docs root.",
  inputSchema: {
    type: "object" as const,
    properties: {
      pattern: {
        type: "string" as const,
        description:
          "The search pattern (basic regex). Example: installation, getting started, import",
      },
      path: {
        type: "string" as const,
        description:
          "File or directory to search in, relative to docs root. Defaults to the entire docs directory. Example: basic-setup",
      },
      include: {
        type: "string" as const,
        description:
          'File glob to filter. Defaults to "*.mdx". Example: *.mdx',
      },
    },
    required: ["pattern"] as const,
  },
})

async function executeGrep(args: {
  pattern: string
  path?: string
  include?: string
}): Promise<string> {
  const pattern = args?.pattern
  if (typeof pattern !== "string" || !pattern.trim()) {
    return "Error: missing search pattern"
  }

  const docsRoot = getDocsRoot()
  let searchPath = docsRoot

  if (args.path && typeof args.path === "string") {
    const resolved = resolveSandboxed(args.path)
    if (!resolved) {
      return `Error: path not allowed: ${args.path}`
    }
    searchPath = resolved
  }

  const includeGlob = args.include && typeof args.include === "string" ? args.include : "*.mdx"

  const grepArgs = ["-rn", `--include=${includeGlob}`, "-i", pattern, searchPath]

  try {
    const output = await new Promise<string>((resolve, reject) => {
      execFile(
        "grep",
        grepArgs,
        {
          cwd: docsRoot,
          timeout: EXEC_TIMEOUT_MS,
          maxBuffer: 1024 * 512,
          env: { PATH: "/usr/bin:/bin:/usr/local/bin", LANG: "en_US.UTF-8" },
        },
        (error, stdout, stderr) => {
          if (error) {
            if (error.code === 1) {
              resolve("No matches found.")
              return
            }
            if (error.killed) {
              reject(new Error("Search timed out"))
              return
            }
            reject(new Error(stderr?.trim() || error.message))
            return
          }
          resolve(stdout)
        }
      )
    })

    if (!output.trim()) return "No matches found."

    // Make paths relative to docs root for readability
    const cleaned = output.replaceAll(docsRoot + "/", "")
    const lines = cleaned.trim().split("\n")

    if (lines.length > MAX_OUTPUT_LINES) {
      return (
        lines.slice(0, MAX_OUTPUT_LINES).join("\n") +
        `\n\n... (${lines.length - MAX_OUTPUT_LINES} more matches)`
      )
    }

    return cleaned.trim()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `Error: ${message}`
  }
}

export const grepTool = grepToolDefinition.server(
  (args: unknown) => executeGrep(args as { pattern: string; path?: string; include?: string })
)

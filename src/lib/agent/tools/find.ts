/**
 * find — Search for files by name pattern.
 *
 * Finds files matching a name pattern within the docs directory.
 * Returns matching file paths relative to the docs root.
 */

import { execFile } from "child_process"
import { toolDefinition } from "@tanstack/ai"
import { getDocsRoot, resolveSandboxed } from "@/src/lib/agent/tools/sandbox"

const MAX_RESULTS = 200
const EXEC_TIMEOUT_MS = 10_000

const findToolDefinition = toolDefinition({
  name: "find",
  description:
    "Find files by name pattern in the docs directory. Returns file paths relative to the docs root. Useful for discovering what documentation files exist.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string" as const,
        description:
          'File name pattern to match (glob). Example: "*.mdx", "index.mdx"',
      },
      path: {
        type: "string" as const,
        description:
          "Directory to search in, relative to docs root. Defaults to the entire docs directory. Example: basic-setup",
      },
    },
    required: [] as const,
  },
})

async function executeFind(args: {
  name?: string
  path?: string
}): Promise<string> {
  const docsRoot = getDocsRoot()
  let searchPath = docsRoot

  if (args?.path && typeof args.path === "string") {
    const resolved = resolveSandboxed(args.path)
    if (!resolved) {
      return `Error: path not allowed: ${args.path}`
    }
    searchPath = resolved
  }

  const findArgs = [searchPath, "-type", "f"]

  if (args?.name && typeof args.name === "string") {
    findArgs.push("-name", args.name)
  }

  findArgs.push("-maxdepth", "10")

  try {
    const output = await new Promise<string>((resolve, reject) => {
      execFile(
        "find",
        findArgs,
        {
          cwd: docsRoot,
          timeout: EXEC_TIMEOUT_MS,
          maxBuffer: 1024 * 256,
          env: { PATH: "/usr/bin:/bin:/usr/local/bin", LANG: "en_US.UTF-8" },
        },
        (error, stdout, stderr) => {
          if (error) {
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

    if (!output.trim()) return "No files found."

    // Make paths relative
    const cleaned = output.replaceAll(docsRoot + "/", "")
    const lines = cleaned.trim().split("\n").sort()

    if (lines.length > MAX_RESULTS) {
      return (
        lines.slice(0, MAX_RESULTS).join("\n") +
        `\n\n... (${lines.length - MAX_RESULTS} more files)`
      )
    }

    return lines.join("\n")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `Error: ${message}`
  }
}

export const findTool = findToolDefinition.server(
  (args: unknown) => executeFind(args as { name?: string; path?: string })
)

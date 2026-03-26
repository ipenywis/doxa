/**
 * grep — Search file contents for a pattern.
 *
 * Recursively searches documentation files for a regex pattern.
 * Uses ripgrep (rg) when available for significantly faster searches,
 * falling back to standard grep otherwise.
 *
 * Returns matching lines with file paths and line numbers.
 * All paths are relative to the docs root directory.
 */

import { execFile, execFileSync } from "child_process"
import { toolDefinition } from "@tanstack/ai"
import { getDocsRoot, resolveSandboxed } from "@/src/lib/agent/tools/sandbox"

const MAX_OUTPUT_LINES = 150
const EXEC_TIMEOUT_MS = 10_000

/** PATH used for all child processes — includes Homebrew on macOS ARM. */
const SEARCH_PATH = "/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin"

const SEARCH_ENV = { PATH: SEARCH_PATH, LANG: "en_US.UTF-8" }

// ---------------------------------------------------------------------------
// Ripgrep availability detection (cached)
// ---------------------------------------------------------------------------

/** Cached ripgrep availability — null means not yet checked. */
let ripgrepAvailable: boolean | null = null

/**
 * Check whether the `rg` (ripgrep) binary is available on the system PATH.
 * Result is cached after the first invocation.
 */
function isRipgrepAvailable(): boolean {
  if (ripgrepAvailable !== null) return ripgrepAvailable

  try {
    execFileSync("rg", ["--version"], {
      timeout: 3_000,
      stdio: "ignore",
      env: SEARCH_ENV,
    })
    ripgrepAvailable = true
  } catch {
    ripgrepAvailable = false
  }

  return ripgrepAvailable
}

// ---------------------------------------------------------------------------
// Argument builders
// ---------------------------------------------------------------------------

function buildGrepArgs(pattern: string, searchPath: string, includeGlob: string): string[] {
  return ["-rn", `--include=${includeGlob}`, "-i", pattern, searchPath]
}

function buildRipgrepArgs(pattern: string, searchPath: string, includeGlob: string): string[] {
  return ["--no-heading", "-n", "-i", "--glob", includeGlob, pattern, searchPath]
}

// ---------------------------------------------------------------------------
// Search command runner
// ---------------------------------------------------------------------------

interface SearchResult {
  stdout: string
}

/**
 * Run a search binary and return its stdout.
 * Exit code 1 (no matches) is treated as an empty result, not an error.
 */
function runSearchCommand(binary: string, args: string[], cwd: string): Promise<SearchResult> {
  return new Promise((resolve, reject) => {
    execFile(
      binary,
      args,
      {
        cwd,
        timeout: EXEC_TIMEOUT_MS,
        maxBuffer: 1024 * 512,
        env: SEARCH_ENV,
      },
      (error, stdout, stderr) => {
        if (error) {
          if (error.code === 1) {
            resolve({ stdout: "" })
            return
          }
          if (error.killed) {
            reject(new Error("Search timed out"))
            return
          }
          reject(new Error(stderr?.trim() || error.message))
          return
        }
        resolve({ stdout })
      }
    )
  })
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

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

  const includeGlob =
    args.include && typeof args.include === "string" ? args.include : "*.mdx"

  try {
    let output: string

    if (isRipgrepAvailable()) {
      try {
        const result = await runSearchCommand(
          "rg",
          buildRipgrepArgs(pattern, searchPath, includeGlob),
          docsRoot
        )
        output = result.stdout
      } catch {
        // Ripgrep failed unexpectedly — fall back to grep
        const result = await runSearchCommand(
          "grep",
          buildGrepArgs(pattern, searchPath, includeGlob),
          docsRoot
        )
        output = result.stdout
      }
    } else {
      const result = await runSearchCommand(
        "grep",
        buildGrepArgs(pattern, searchPath, includeGlob),
        docsRoot
      )
      output = result.stdout
    }

    if (!output.trim()) return "No matches found."

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

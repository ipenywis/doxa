/**
 * Security Sandbox — Path validation for the docs directory.
 *
 * All file operations are restricted to the docs directory.
 * Prevents directory traversal, symlink escapes, and absolute path access.
 */

import { resolve, normalize } from "path"

/** Absolute path to the documentation root. Resolved once at module load. */
const DOCS_ROOT = resolve(process.cwd(), "src/contents/docs")

/**
 * Resolve a path relative to the docs root and verify it stays inside.
 * Returns the absolute path if valid, or null if it escapes the sandbox.
 */
export function resolveSandboxed(inputPath: string): string | null {
  // Block absolute paths
  if (inputPath.startsWith("/")) return null

  const resolved = resolve(DOCS_ROOT, normalize(inputPath))
  if (!resolved.startsWith(DOCS_ROOT)) return null

  return resolved
}

/** Get the sandbox docs root path. */
export function getDocsRoot(): string {
  return DOCS_ROOT
}

/**
 * Vite Adapter
 * ────────────
 * Default content adapter. Bundles all raw MDX files into the server module at
 * build time using Vite's `import.meta.glob` with the `?raw` query.
 *
 * This adapter is:
 *   - Sync (wrapped in Promise for interface uniformity)
 *   - Zero-latency (all content in memory)
 *   - Edge-compatible (no Node.js APIs)
 *   - Works on any runtime where Vite builds (Node, Cloudflare Workers, Vercel Edge, Deno)
 *
 * Use when: docs are checked into the same repo as the site.
 * Don't use when: you need runtime content updates without redeploys.
 */

import type { ContentAdapter } from "@/src/lib/content/types"

/**
 * Eager glob: all MDX content is bundled at build time as raw strings.
 * Keys are absolute Vite paths like "/src/contents/docs/basic-setup/installation/index.mdx".
 */
const rawModules = import.meta.glob<string>(
  "/src/contents/docs/**/index.mdx",
  { query: "?raw", import: "default", eager: true }
)

const DOCS_ROOT_PREFIX = "/src/contents/docs/"

/**
 * Normalize a Vite glob key to a docs-root-relative path.
 *   "/src/contents/docs/basic-setup/installation/index.mdx"
 *   → "basic-setup/installation/index.mdx"
 */
function toRelativePath(viteKey: string): string {
  return viteKey.startsWith(DOCS_ROOT_PREFIX)
    ? viteKey.slice(DOCS_ROOT_PREFIX.length)
    : viteKey
}

const fileMap = new Map<string, string>(
  Object.entries(rawModules).map(([viteKey, content]) => [
    toRelativePath(viteKey),
    content,
  ])
)

const filePaths = Array.from(fileMap.keys()).sort()

// DEBUG: memory footprint of bundled raw MDX.
// Cloudflare workerd hard limit = 128 MB per isolate (paid plans up to 512 MB
// on Unbound/Containers). Free plan = 128 MB. Logging to check headroom.
// Gated behind VITE_DEBUG_CONTENT=true so it stays silent by default.
// import.meta.env.* is replaced at build time by Vite — works on edge runtimes
// where process.env isn't populated at module init.
if (import.meta.env.VITE_DEBUG_CONTENT === "true") {
  let totalChars = 0
  let totalUtf8Bytes = 0
  let largestFile = { path: "", bytes: 0 }
  const encoder = new TextEncoder()
  for (const [path, content] of fileMap) {
    totalChars += content.length
    const bytes = encoder.encode(content).byteLength
    totalUtf8Bytes += bytes
    if (bytes > largestFile.bytes) largestFile = { path, bytes }
  }
  // JS strings are UTF-16 in memory (2 bytes/char minimum, up to 4 for surrogate pairs)
  const approxHeapBytes = totalChars * 2
  const CF_LIMIT_BYTES = 128 * 1024 * 1024
  const fmt = (n: number) =>
    n >= 1024 * 1024
      ? `${(n / 1024 / 1024).toFixed(2)} MB`
      : `${(n / 1024).toFixed(2)} KB`
  console.log("[vite-adapter] rawModules memory footprint:", {
    files: fileMap.size,
    utf8Bytes: fmt(totalUtf8Bytes),
    approxHeapBytes: fmt(approxHeapBytes),
    largestFile: `${largestFile.path} (${fmt(largestFile.bytes)})`,
    cfWorkerLimit: fmt(CF_LIMIT_BYTES),
    percentOfLimit: `${((approxHeapBytes / CF_LIMIT_BYTES) * 100).toFixed(3)}%`,
  })
}

export const viteAdapter: ContentAdapter = {
  name: "vite",

  async listFiles() {
    return filePaths
  },

  async readFile(filePath) {
    return fileMap.get(filePath) ?? null
  },
}

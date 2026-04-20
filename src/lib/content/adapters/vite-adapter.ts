/**
 * Vite Adapter
 * ────────────
 * Default content adapter. Reads raw MDX source from the `__rawSource` named
 * export injected by `mdxSourceCapturePlugin` (see `vite.config.ts`) at build
 * time. Each `.mdx` file is bundled exactly once — the compiled React
 * component (default export) and the raw source string (`__rawSource` export)
 * ship from the same module. The route renderer consumes `default`; this
 * adapter consumes `__rawSource`.
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
 * Shape of each compiled MDX module. `default` is the React component
 * (consumed by `src/routes/docs/$.tsx`); `__rawSource` is the verbatim
 * source text injected by `mdxSourceCapturePlugin`.
 */
type MdxModule = {
  __rawSource: string
}

/**
 * Eager glob of the compiled MDX modules. Keys are absolute Vite paths like
 * "/src/contents/docs/basic-setup/installation/index.mdx".
 */
const mdxModules = import.meta.glob<MdxModule>(
  "/src/contents/docs/**/index.mdx",
  { eager: true }
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
  Object.entries(mdxModules).map(([viteKey, mod]) => {
    const source = mod?.__rawSource
    if (typeof source !== "string") {
      throw new Error(
        `[vite-adapter] Missing __rawSource on ${viteKey}. ` +
          `mdxSourceCapturePlugin is not wired correctly in vite.config.ts.`
      )
    }
    return [toRelativePath(viteKey), source]
  })
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
  console.log("[vite-adapter] mdxModules memory footprint:", {
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

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

import { nonDefaultSections } from "@/src/settings/sections";
import type { ContentAdapter } from "@/src/lib/content/types";

/**
 * Shape of each compiled MDX module. `default` is the React component
 * (consumed by `src/routes/docs/$.tsx`); `__rawSource` is the verbatim
 * source text injected by `mdxSourceCapturePlugin`.
 */
interface MdxModule {
  __rawSource: string;
}

/**
 * Eager glob of the compiled MDX modules. Keys are absolute Vite paths like
 * "/src/contents/docs/basic-setup/installation/index.mdx".
 */
const mdxModules = import.meta.glob<MdxModule>(
  "/src/contents/docs/**/index.mdx",
  { eager: true }
);

const DOCS_ROOT_PREFIX = "/src/contents/docs/";
const DEFAULT_SECTION_PREFIX = "default/";

/**
 * Normalize a Vite glob key to a docs-root-relative path.
 *   "/src/contents/docs/basic-setup/installation/index.mdx"
 *   → "basic-setup/installation/index.mdx"
 */
function toRelativePath(viteKey: string): string {
  return viteKey.startsWith(DOCS_ROOT_PREFIX)
    ? viteKey.slice(DOCS_ROOT_PREFIX.length)
    : viteKey;
}

/**
 * Strip the `default/` folder prefix when present so the canonical path the
 * store sees never contains it. Pages physically located at
 * `default/<slug>/index.mdx` resolve to URL `/<slug>` — the rootless layout
 * is the public contract.
 */
function toCanonicalPath(relativePath: string): string {
  return relativePath.startsWith(DEFAULT_SECTION_PREFIX)
    ? relativePath.slice(DEFAULT_SECTION_PREFIX.length)
    : relativePath;
}

/**
 * True when the canonical path belongs to the default section — i.e. its
 * first segment is NOT a non-default section slug.
 */
function isDefaultSectionPath(canonicalPath: string): boolean {
  const firstSegment = canonicalPath.split("/", 1)[0];
  return !nonDefaultSections.some((section) => section.slug === firstSegment);
}

/**
 * Build the file map.
 *
 * Default-section content may live in either of two layouts:
 *   1. Under `default/<page>/index.mdx` (canonical, written by the CLI).
 *   2. Rootless at `<page>/index.mdx` (legacy template / hand-authored sites).
 *
 * Both resolve to the same canonical key (`<page>/index.mdx`). When both
 * exist for the same page, the `default/` copy wins — that's the new source
 * of truth — and we log a warning.
 */
const fileMap = (() => {
  const map = new Map<string, string>();
  const defaultEntries: [string, string][] = [];
  const otherEntries: [string, string][] = [];

  for (const [viteKey, mod] of Object.entries(mdxModules)) {
    const source = mod?.__rawSource;
    if (typeof source !== "string") {
      throw new Error(
        `[vite-adapter] Missing __rawSource on ${viteKey}. ` +
          `mdxSourceCapturePlugin is not wired correctly in vite.config.ts.`
      );
    }
    const relativePath = toRelativePath(viteKey);
    if (relativePath.startsWith(DEFAULT_SECTION_PREFIX)) {
      defaultEntries.push([toCanonicalPath(relativePath), source]);
    } else {
      otherEntries.push([relativePath, source]);
    }
  }

  // Seed legacy/non-default entries first; default/ entries override later.
  for (const [path, source] of otherEntries) map.set(path, source);
  for (const [path, source] of defaultEntries) {
    if (map.has(path) && isDefaultSectionPath(path)) {
      console.warn(
        `[vite-adapter] Both default/${path} and ${path} exist; preferring default/${path}. ` +
          `Delete the rootless copy once migration is complete.`
      );
    }
    map.set(path, source);
  }

  return map;
})();

const filePaths = Array.from(fileMap.keys()).sort();

// DEBUG: memory footprint of bundled raw MDX.
// Cloudflare workerd hard limit = 128 MB per isolate (paid plans up to 512 MB
// on Unbound/Containers). Free plan = 128 MB. Logging to check headroom.
// Gated behind VITE_DEBUG_CONTENT=true so it stays silent by default.
// import.meta.env.* is replaced at build time by Vite — works on edge runtimes
// where process.env isn't populated at module init.
if (import.meta.env.VITE_DEBUG_CONTENT === "true") {
  let totalChars = 0;
  let totalUtf8Bytes = 0;
  let largestFile = { path: "", bytes: 0 };
  const encoder = new TextEncoder();
  for (const [path, content] of fileMap) {
    totalChars += content.length;
    const bytes = encoder.encode(content).byteLength;
    totalUtf8Bytes += bytes;
    if (bytes > largestFile.bytes) largestFile = { path, bytes };
  }
  // JS strings are UTF-16 in memory (2 bytes/char minimum, up to 4 for surrogate pairs)
  const approxHeapBytes = totalChars * 2;
  const CF_LIMIT_BYTES = 128 * 1024 * 1024;
  const fmt = (n: number) =>
    n >= 1024 * 1024
      ? `${(n / 1024 / 1024).toFixed(2)} MB`
      : `${(n / 1024).toFixed(2)} KB`;
  console.log("[vite-adapter] mdxModules memory footprint:", {
    files: fileMap.size,
    utf8Bytes: fmt(totalUtf8Bytes),
    approxHeapBytes: fmt(approxHeapBytes),
    largestFile: `${largestFile.path} (${fmt(largestFile.bytes)})`,
    cfWorkerLimit: fmt(CF_LIMIT_BYTES),
    percentOfLimit: `${((approxHeapBytes / CF_LIMIT_BYTES) * 100).toFixed(3)}%`,
  });
}

export const viteAdapter: ContentAdapter = {
  name: "vite",

  async listFiles() {
    return filePaths;
  },

  async readFile(filePath) {
    return fileMap.get(filePath) ?? null;
  },
};

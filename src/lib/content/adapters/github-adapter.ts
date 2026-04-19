/**
 * GitHub Adapter
 * ──────────────
 * Fetches MDX content from a GitHub repo at runtime via the GitHub REST API.
 *
 * Use when:
 *   - Docs live in a separate repo from the site
 *   - Content editors work in the GitHub web UI or via PRs
 *   - You want content updates without redeploying the site
 *   - You need private docs (token-auth'd repos)
 *
 * Don't use when:
 *   - You can tolerate cold-start latency for file tree fetches (hundreds of ms)
 *   - You hit the 5000 req/hr authenticated rate limit with high traffic
 *
 * Caching:
 *   File tree cached for `cacheTTLSeconds` (default 300s / 5min).
 *   Individual file contents keyed by (path, sha) — when the tree refreshes
 *   and a file's sha changes, the cached content is invalidated automatically.
 *
 * Rate limits:
 *   - 60 req/hr unauthenticated
 *   - 5000 req/hr with a token
 *   Cache TTL protects against bursts.
 */

import type { ContentAdapter } from "@/src/lib/content/types"

export interface GitHubAdapterConfig {
  owner: string
  repo: string
  branch?: string
  basePath: string
  token?: string
  cacheTTLSeconds?: number
}

interface TreeEntry {
  path: string
  type: "blob" | "tree"
  sha: string
}

interface TreeResponse {
  tree: TreeEntry[]
  truncated?: boolean
}

interface CachedTree {
  paths: string[]
  shaByPath: Map<string, string>
  expiresAt: number
}

const GITHUB_API = "https://api.github.com"

export function createGitHubAdapter(config: GitHubAdapterConfig): ContentAdapter {
  const branch = config.branch || "main"
  const basePath = config.basePath.replace(/\/$/, "")
  const ttlMs = (config.cacheTTLSeconds ?? 300) * 1000

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "doxa-docs-template",
  }
  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`
  }

  let treeCache: CachedTree | null = null
  const contentCache = new Map<string, { content: string; sha: string }>()

  async function githubFetch(url: string): Promise<Response> {
    const response = await fetch(url, { headers })

    if (response.status === 401 || response.status === 403) {
      const body = await response.text().catch(() => "")
      throw new Error(
        `GitHub API auth failed (${response.status}): check DOXA_GITHUB_TOKEN. ${body}`
      )
    }
    if (response.status === 429) {
      throw new Error("GitHub API rate limit exceeded. Increase cache TTL or add a token.")
    }

    return response
  }

  async function fetchTree(): Promise<CachedTree> {
    const now = Date.now()
    if (treeCache && treeCache.expiresAt > now) return treeCache

    const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/git/trees/${branch}?recursive=1`
    const response = await githubFetch(url)
    if (!response.ok) {
      throw new Error(`GitHub tree fetch failed (${response.status}): ${url}`)
    }

    const data = (await response.json()) as TreeResponse
    if (data.truncated) {
      console.warn(
        "[github-adapter] GitHub tree response truncated — repo exceeds 100k files or 7MB. Some docs may be missing."
      )
    }

    const prefix = basePath ? `${basePath}/` : ""
    const paths: string[] = []
    const shaByPath = new Map<string, string>()

    for (const entry of data.tree) {
      if (entry.type !== "blob") continue
      if (!entry.path.endsWith(".mdx")) continue
      if (prefix && !entry.path.startsWith(prefix)) continue

      const relativePath = prefix ? entry.path.slice(prefix.length) : entry.path
      paths.push(relativePath)
      shaByPath.set(relativePath, entry.sha)
    }

    treeCache = {
      paths: paths.sort(),
      shaByPath,
      expiresAt: now + ttlMs,
    }

    return treeCache
  }

  async function fetchBlob(sha: string): Promise<string> {
    const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/git/blobs/${sha}`
    const response = await githubFetch(url)
    if (!response.ok) {
      throw new Error(`GitHub blob fetch failed (${response.status}): ${sha}`)
    }

    const data = (await response.json()) as { content: string; encoding: string }
    if (data.encoding !== "base64") {
      throw new Error(`Unexpected GitHub blob encoding: ${data.encoding}`)
    }

    return decodeBase64(data.content)
  }

  return {
    name: "github",

    async listFiles() {
      const tree = await fetchTree()
      return tree.paths
    },

    async readFile(filePath) {
      const tree = await fetchTree()
      const sha = tree.shaByPath.get(filePath)
      if (!sha) return null

      const cached = contentCache.get(filePath)
      if (cached && cached.sha === sha) return cached.content

      const content = await fetchBlob(sha)
      contentCache.set(filePath, { content, sha })
      return content
    },
  }
}

/**
 * Base64-decode using platform-native APIs (works on Node, browsers, edge
 * runtimes). GitHub returns blob content as base64 with embedded newlines.
 */
function decodeBase64(input: string): string {
  const cleaned = input.replace(/\s/g, "")

  if (typeof atob === "function") {
    const binary = atob(cleaned)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder("utf-8").decode(bytes)
  }

  return Buffer.from(cleaned, "base64").toString("utf-8")
}

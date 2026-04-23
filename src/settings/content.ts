/**
 * Content Source Configuration
 * ────────────────────────────
 *
 * This template ships two content adapters out of the box. Pick one by
 * setting the `CONTENT_SOURCE` environment variable (or edit `defaultSource`
 * below to change the built-in default).
 *
 *   ┌─────────┬──────────────────────────────────────────────────────────┐
 *   │ "vite"  │ (default) MDX files live in src/contents/docs/ and get   │
 *   │         │ bundled into the deployment at build time.               │
 *   │         │                                                          │
 *   │         │ Use when: docs are in the same repo as the site.         │
 *   │         │ Pros: zero latency, works offline, no API keys.          │
 *   │         │ Cons: content updates require redeploying.               │
 *   ├─────────┼──────────────────────────────────────────────────────────┤
 *   │ "github"│ MDX files live in a separate GitHub repo and are         │
 *   │         │ fetched at runtime via the GitHub REST API.              │
 *   │         │                                                          │
 *   │         │ Use when: content team edits in GitHub web UI, or        │
 *   │         │   you want updates without redeploys.                    │
 *   │         │ Pros: content/site decoupled, edit via GitHub UI.        │
 *   │         │ Cons: cold-start latency, rate-limited, needs token      │
 *   │         │   for private repos.                                     │
 *   └─────────┴──────────────────────────────────────────────────────────┘
 *
 * ─── Switching to GitHub mode ───────────────────────────────────────────
 *
 *   1. Set `CONTENT_SOURCE=github` in your environment
 *   2. Set the required GitHub vars (see .env.example):
 *         DOXA_GITHUB_OWNER       — repo owner (e.g. "your-org")
 *         DOXA_GITHUB_REPO        — repo name (e.g. "your-docs")
 *         DOXA_GITHUB_BRANCH      — (optional) default "main
 *         DOXA_GITHUB_BASE_PATH   — (optional) default "src/contents/docs"
 *         DOXA_GITHUB_TOKEN       — (optional) PAT, required for private repos
 *         DOXA_GITHUB_CACHE_TTL   — (optional) cache TTL in seconds, default 300
 *
 *   3. Redeploy. Content now streams from GitHub — edits to the docs repo
 *      appear on the site within cacheTTLSeconds.
 *
 *   Creating a GitHub token:
 *     - Public repos: no token needed (60 req/hr limit)
 *     - Private repos: create a fine-grained PAT at
 *       https://github.com/settings/tokens?type=beta
 *       with "Contents: Read-only" permission on the docs repo
 *
 * ─── Adding your own adapter (R2, KV, Supabase, Notion, etc.) ───────────
 *
 *   1. Implement the ContentAdapter interface from src/lib/content/types.ts
 *   2. Add a case to the `resolveAdapter()` switch below
 *   3. Add any needed env vars to .env.example
 *   4. Document the new source in README.md
 *
 * ────────────────────────────────────────────────────────────────────────
 */

import { createGitHubAdapter } from "@/src/lib/content/adapters/github-adapter";
import { viteAdapter } from "@/src/lib/content/adapters/vite-adapter";
import type { ContentAdapter } from "@/src/lib/content/types";

export type ContentSource = "vite" | "github";

/** Fallback source when CONTENT_SOURCE env var is not set */
const defaultSource: ContentSource = "vite";

/**
 * Resolve the active ContentAdapter based on env configuration.
 * Called once at module load by src/lib/content/store.ts.
 */
export function resolveAdapter(): ContentAdapter {
  const source = (process.env.CONTENT_SOURCE as ContentSource) || defaultSource;

  switch (source) {
    case "vite":
      return viteAdapter;

    case "github":
      return createGitHubAdapter({
        owner: requireEnv("DOXA_GITHUB_OWNER"),
        repo: requireEnv("DOXA_GITHUB_REPO"),
        branch: process.env.DOXA_GITHUB_BRANCH,
        basePath: process.env.DOXA_GITHUB_BASE_PATH || "src/contents/docs",
        token: process.env.DOXA_GITHUB_TOKEN,
        cacheTTLSeconds: process.env.DOXA_GITHUB_CACHE_TTL
          ? Number(process.env.DOXA_GITHUB_CACHE_TTL)
          : undefined,
      });

    default:
      throw new Error(
        `Unknown CONTENT_SOURCE: "${source}". Expected "vite" or "github".`
      );
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. See src/settings/content.ts for setup.`
    );
  }
  return value;
}

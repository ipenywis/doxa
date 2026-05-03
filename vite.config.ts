import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

import { cloudflare } from "@cloudflare/vite-plugin";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeCodeTitles from "rehype-code-titles";
import rehypeKatex from "rehype-katex";
import rehypePrism from "rehype-prism-plus";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { defineConfig, loadEnv, type PluginOption } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

import Documents from "./src/contents/settings/documents.json";
import { rehypePreCopy, remarkStripFrontmatter } from "./src/lib/mdx-plugins";
import { resolveSiteUrl } from "./src/lib/site-url";

/**
 * mdxSourceCapturePlugin
 * ──────────────────────
 * Runs AFTER `@mdx-js/rollup`'s transform. For every MDX file under
 * `src/contents/docs/`, it re-reads the original source from disk and
 * appends a `__rawSource` named export to the compiled module:
 *
 *     export const __rawSource = "<verbatim .mdx file contents>";
 *
 * Why: the content layer (`src/lib/content/adapters/vite-adapter.ts`, used
 * by the AI chat agent, /llms.txt, /llms-full.txt, and BM25 search) needs
 * the raw MDX text — not the compiled React component. Injecting it as a
 * sibling export on the SAME module means we bundle each `.mdx` exactly
 * once. The route renderer (`src/routes/docs/$.tsx`) reads `default` for
 * the component; the adapter reads `__rawSource` for the text.
 *
 * Tree-shaking: the client bundle never references `__rawSource`, so Vite
 * drops it from client chunks automatically. Only the SSR bundle carries
 * the raw strings.
 *
 * Collision note: the dunder prefix signals "framework-injected, don't
 * author". An MDX file writing its own `export const __rawSource` would
 * collide; no current docs do, and the naming convention makes the risk
 * explicit.
 */
const DOCS_SOURCE_ROOT = "/src/contents/docs/";

function mdxSourceCapturePlugin(): PluginOption {
  return {
    name: "doxa:mdx-source-capture",
    enforce: "post",
    async transform(code, id) {
      const [filePath] = id.split("?");
      if (!filePath.endsWith(".mdx")) return null;
      if (!filePath.includes(DOCS_SOURCE_ROOT)) return null;
      const source = await readFile(filePath, "utf-8");
      return {
        code: `${code}\nexport const __rawSource = ${JSON.stringify(source)};\n`,
        map: null,
      };
    },
  };
}

type DeploymentTarget = "cloudflare" | "vercel";

interface DocumentRoute {
  title?: string;
  href?: string;
  noLink?: true;
  items?: DocumentRoute[];
}

interface SitemapPage {
  path: string;
  sitemap?: {
    lastmod?: string;
  };
}

const prerenderConfig = {
  enabled: true,
  crawlLinks: true,
  autoSubfolderIndex: true,
  autoStaticPathsDiscovery: false,
  concurrency: 14,
  retryCount: 2,
  retryDelay: 1000,
  maxRedirects: 5,
  failOnError: true,
  onSuccess: ({ page }: { page: { path: string } }) => {
    console.log("Prerendered path:", page.path);
  },
};
const gitLastModifiedCache = new Map<string, string | undefined>();

function getGitLastModifiedDate(filePath: string): string | undefined {
  const cached = gitLastModifiedCache.get(filePath);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const lastModified = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--follow", "--", filePath],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }
    ).trim();

    const resolved = lastModified || undefined;
    gitLastModifiedCache.set(filePath, resolved);
    return resolved;
  } catch {
    gitLastModifiedCache.set(filePath, undefined);
    return undefined;
  }
}

function getDocsPages(routes: DocumentRoute[], parentHref = ""): SitemapPage[] {
  const pages: SitemapPage[] = [];

  for (const route of routes) {
    if (route.title && route.href) {
      const href = `${parentHref}${route.href}`;
      const filePath = `src/contents/docs${href}/index.mdx`;
      const lastModified = getGitLastModifiedDate(filePath);

      if (!route.noLink) {
        pages.push({
          path: href,
          sitemap: lastModified
            ? {
                lastmod: lastModified,
              }
            : undefined,
        });
      }

      if (route.items) {
        pages.push(...getDocsPages(route.items, href));
      }
    }
  }

  return pages;
}

function getSitemapPages() {
  const docPages = getDocsPages(Documents as DocumentRoute[]);
  const firstDoc = docPages[0];

  return [
    {
      path: "/",
      sitemap: firstDoc?.sitemap,
    } satisfies SitemapPage,
    ...docPages,
  ];
}

function getDeploymentTarget(): DeploymentTarget {
  return process.env.DOXA_DEPLOY_TARGET === "vercel" ? "vercel" : "cloudflare";
}

function getHostingPlugins(target: DeploymentTarget): PluginOption[] {
  if (target === "vercel") {
    return [nitro({ preset: "vercel" })];
  }

  return [cloudflare({ viteEnvironment: { name: "ssr" } })];
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const deploymentTarget = getDeploymentTarget();
  const sitemapHost = resolveSiteUrl({
    ...process.env,
    ...env,
  });
  const buildConfig =
    deploymentTarget === "cloudflare"
      ? {
          rollupOptions: {
            output: {
              manualChunks: {
                mermaid: ["mermaid"],
                react: ["react", "react-dom"],
              },
            },
          },
        }
      : undefined;

  const startConfig =
    deploymentTarget === "cloudflare"
      ? {
          server: {
            entry: "./src/server.ts",
          },
          pages: getSitemapPages(),
          prerender: prerenderConfig,
          sitemap: {
            enabled: true,
            host: sitemapHost,
          },
        }
      : {
          server: {
            entry: "./src/server.ts",
          },
          pages: getSitemapPages(),
          sitemap: {
            enabled: true,
            host: sitemapHost,
          },
        };

  return {
    base: "/",
    server: {
      port: 3000,
    },
    build: buildConfig,
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      mdx({
        remarkPlugins: [remarkFrontmatter, remarkStripFrontmatter, remarkGfm],
        rehypePlugins: [
          rehypePreCopy,
          rehypeCodeTitles,
          rehypeKatex,
          rehypePrism,
          rehypeSlug,
          rehypeAutolinkHeadings,
        ],
      }),
      mdxSourceCapturePlugin(),
      tailwindcss(),
      tanstackStart(startConfig),
      viteReact(),
      ...getHostingPlugins(deploymentTarget),
    ],
  };
});

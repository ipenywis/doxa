import mdx from "@mdx-js/rollup"
import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeCodeTitles from "rehype-code-titles"
import rehypeKatex from "rehype-katex"
import rehypePrism from "rehype-prism-plus"
import rehypeSlug from "rehype-slug"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import { defineConfig, type PluginOption } from "vite"
import tsConfigPaths from "vite-tsconfig-paths"

import {
  rehypePreCopy,
  remarkStripFrontmatter,
} from "./src/lib/mdx-plugins"

type DeploymentTarget = "cloudflare" | "vercel"

const prerenderConfig = {
  enabled: true,
  crawlLinks: true,
  autoSubfolderIndex: true,
  autoStaticPathsDiscovery: true,
  concurrency: 14,
  retryCount: 2,
  retryDelay: 1000,
  maxRedirects: 5,
  failOnError: true,
  onSuccess: ({ page }: { page: { path: string } }) => {
    console.log("Prerendered path:", page.path)
  },
}

function getDeploymentTarget(): DeploymentTarget {
  return process.env.DOXA_DEPLOY_TARGET === "vercel"
    ? "vercel"
    : "cloudflare"
}

function getHostingPlugins(target: DeploymentTarget): PluginOption[] {
  if (target === "vercel") {
    return [nitro({ preset: "vercel" })]
  }

  return [cloudflare({ viteEnvironment: { name: "ssr" } })]
}

export default defineConfig(() => {
  const deploymentTarget = getDeploymentTarget()
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
      : undefined

  const startConfig =
    deploymentTarget === "cloudflare"
      ? {
          server: {
            entry: "./src/server.ts",
          },
          prerender: prerenderConfig,
        }
      : {
          server: {
            entry: "./src/server.ts",
          },
        }

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
      tailwindcss(),
      tanstackStart(startConfig),
      viteReact(),
      ...getHostingPlugins(deploymentTarget),
    ],
  }
})

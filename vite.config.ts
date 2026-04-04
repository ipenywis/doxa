import mdx from "@mdx-js/rollup"
import {
  rehypePreCopy,
  remarkStripFrontmatter,
} from "./src/lib/mdx-plugins"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeCodeTitles from "rehype-code-titles"
import rehypeKatex from "rehype-katex"
import rehypePrism from "rehype-prism-plus"
import rehypeSlug from "rehype-slug"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import { defineConfig } from "vite"
import tsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  base: "/",
  server: {
    port: 3000,
  },
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
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoSubfolderIndex: true,
        autoStaticPathsDiscovery: true,
        concurrency: 14,
        retryCount: 2,
        retryDelay: 1000,
        maxRedirects: 5,
        failOnError: true,
        onSuccess: ({ page }) => {
          console.log("Prerendered path:", page.path)
        }
      },
    }),
    viteReact(),
  ],
})

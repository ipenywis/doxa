import { PageRoutes } from "@/src/lib/pageroutes"
import { GitHubLink } from "@/src/settings/navigation"
import { compile } from "@mdx-js/mdx"
import { createServerFn } from "@tanstack/react-start"
import matter from "gray-matter"
import type { Element, Text } from "hast"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeCodeTitles from "rehype-code-titles"
import rehypeKatex from "rehype-katex"
import rehypePrism from "rehype-prism-plus"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import { Node } from "unist"
import { visit } from "unist-util-visit"

import { Settings } from "@/src/types/settings"

declare module "hast" {
  interface Element {
    raw?: string
  }
}

export interface BaseMdxFrontmatter {
  title: string
  description: string
  keywords: string
}

async function compileMdx<Frontmatter>(rawMdx: string) {
  const { content, data } = matter(rawMdx)

  const compiledMdx = await compile(content, {
    outputFormat: "function-body",
    rehypePlugins: [
      preCopy,
      rehypeCodeTitles,
      rehypeKatex,
      rehypePrism,
      rehypeSlug,
      rehypeAutolinkHeadings,
      postCopy,
    ],
    remarkPlugins: [remarkGfm],
  })

  return {
    frontmatter: data as Frontmatter,
    code: String(compiledMdx),
  }
}

const getDocumentPath = (slug: string) => {
  return Settings.gitload
    ? `${GitHubLink.href}/raw/main/src/contents/docs/${slug}/index.mdx`
    : `${process.cwd()}/src/contents/docs/${slug}/index.mdx`
}

// Server function to read file content
const readFileContent = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const contentPath = getDocumentPath(slug)
    let rawMdx = ""
    let lastUpdated: string | null = null

    if (Settings.gitload) {
      const response = await fetch(contentPath)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch content from GitHub: ${response.statusText}`
        )
      }
      rawMdx = await response.text()
      lastUpdated = response.headers.get("Last-Modified") ?? null
    } else {
      // Dynamic import for server-only modules
      const fs = await import("fs/promises")
      rawMdx = await fs.readFile(contentPath, "utf-8")
      const stats = await fs.stat(contentPath)
      lastUpdated = stats.mtime.toISOString()
    }

    return { rawMdx, lastUpdated }
  })

export async function getDocument(slug: string) {
  try {
    const { rawMdx, lastUpdated } = await readFileContent({ data: slug })

    const compiled = await compileMdx<BaseMdxFrontmatter>(rawMdx)
    const tocs = await getTable(slug)

    return {
      frontmatter: compiled.frontmatter,
      code: compiled.code,
      tocs,
      lastUpdated,
    }
  } catch (err) {
    console.error(err)
    return null
  }
}

// Server function that can be called from client components
export const fetchDocumentFromServer = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    try {
      const { rawMdx, lastUpdated } = await readFileContent({ data: slug })

      const compiled = await compileMdx<BaseMdxFrontmatter>(rawMdx)

      // Get table of contents inline to avoid nested server function calls
      const extractedHeadings: { level: number; text: string; href: string }[] = []
      const headingsRe = /^(#{2,4})\s(.+)$/gm
      let match
      while ((match = headingsRe.exec(rawMdx)) !== null) {
        const level = match[1].length
        const text = match[2].trim()
        extractedHeadings.push({
          level,
          text,
          href: `#${text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, "")}`,
        })
      }

      return {
        frontmatter: compiled.frontmatter,
        code: compiled.code,
        tocs: extractedHeadings,
        lastUpdated,
      }
    } catch (err) {
      console.error(err)
      return null
    }
  })

const headingsRegex = /^(#{2,4})\s(.+)$/gm

// Server function to get raw MDX for table of contents
const readRawMdx = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    let rawMdx = ""

    if (Settings.gitload) {
      const contentPath = `${GitHubLink.href}/raw/main/src/contents/docs/${slug}/index.mdx`
      const response = await fetch(contentPath)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch content from GitHub: ${response.statusText}`
        )
      }
      rawMdx = await response.text()
    } else {
      const contentPath = `${process.cwd()}/src/contents/docs/${slug}/index.mdx`
      const fs = await import("fs/promises")
      rawMdx = await fs.readFile(contentPath, "utf-8")
    }

    return rawMdx
  })

export async function getTable(
  slug: string
): Promise<{ level: number; text: string; href: string }[]> {
  const extractedHeadings: {
    level: number
    text: string
    href: string
  }[] = []

  try {
    const rawMdx = await readRawMdx({ data: slug })

    let match
    while ((match = headingsRegex.exec(rawMdx)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      extractedHeadings.push({
        level: level,
        text: text,
        href: `#${innerslug(text)}`,
      })
    }
  } catch (error) {
    console.error("Error reading file:", error)
    return []
  }

  return extractedHeadings
}

function innerslug(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, "")
}

const pathIndexMap = new Map(
  PageRoutes.map((route, index) => [route.href, index])
)

export function getPreviousNext(path: string) {
  const index = pathIndexMap.get(`/${path}`)

  if (index === undefined || index === -1) {
    return { prev: null, next: null }
  }

  const prev = index > 0 ? PageRoutes[index - 1] : null
  const next = index < PageRoutes.length - 1 ? PageRoutes[index + 1] : null

  return { prev, next }
}

const preCopy = () => (tree: Node) => {
  visit(tree, "element", (node: Element) => {
    if (node.tagName === "pre") {
      const [codeEl] = node.children as Element[]
      if (codeEl?.tagName === "code") {
        const textNode = codeEl.children?.[0] as Text
        node.raw = textNode?.value || ""
      }
    }
  })
}

const postCopy = () => (tree: Node) => {
  visit(tree, "element", (node: Element) => {
    if (node.tagName === "pre" && node.raw) {
      node.properties = node.properties || {}
      node.properties["raw"] = node.raw
    }
  })
}

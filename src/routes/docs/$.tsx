"use client"

import { createElement, useEffect, useState } from "react"
import * as runtime from "react/jsx-runtime"
import { ArticleBreadcrumb } from "@/src/components/article/breadcrumb"
import { Pagination } from "@/src/components/article/pagination"
import { TableOfContents } from "@/src/components/toc"
import { components } from "@/src/lib/components"
import { fetchDocument } from "@/src/lib/markdown"
import { PageRoutes } from "@/src/lib/pageroutes"
import type { BaseMdxFrontmatter } from "@/src/lib/markdown"
import { run } from "@mdx-js/mdx"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/docs/$")({
  component: DocsContent,
})

interface DocumentData {
  frontmatter: BaseMdxFrontmatter
  code: string
  tocs: { level: number; text: string; href: string }[]
  lastUpdated: string | null
}

function MdxContent({ code }: { code: string }) {
  const [content, setContent] = useState<React.ReactNode>(null)

  useEffect(() => {
    async function renderMdx() {
      try {
        const { default: MDXContent } = await run(code, {
          ...runtime,
          baseUrl: import.meta.url,
        })
        setContent(createElement(MDXContent, { components }))
      } catch (error) {
        console.error("Failed to render MDX:", error)
        setContent(<p className="text-red-500">Failed to render content</p>)
      }
    }
    renderMdx()
  }, [code])

  if (!content) {
    return <div className="animate-pulse">Loading content...</div>
  }

  return <>{content}</>
}

function DocsContent() {
  const { _splat } = Route.useParams()
  const slug = _splat || "basic-setup"
  const paths = slug.split("/")
  const pathName = `docs/${slug}`

  const [document, setDocument] = useState<DocumentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch document when slug changes
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    fetchDocument({ data: slug }).then((doc) => {
      if (!cancelled) {
        setDocument(doc)
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [slug])

  // Find the current route to get its title
  const currentRoute = PageRoutes.find((r) => r.href === `/${slug}`)
  const title =
    document?.frontmatter?.title ||
    currentRoute?.title ||
    slug.split("/").pop() ||
    "Documentation"

  if (isLoading) {
    return (
      <div className="flex items-start gap-14">
        <article className="prose-code:font-code prose-inline-code:before:content-[''] prose-inline-code:after:content-[''] prose flex-1 prose-zinc dark:prose-invert prose-headings:scroll-m-20 prose-pre:border prose-pre:bg-muted/25 prose-img:rounded-md">
          <ArticleBreadcrumb paths={paths} />
          <div className="animate-pulse">
            <div className="h-10 w-3/4 rounded bg-muted mb-4"></div>
            <div className="h-4 w-full rounded bg-muted mb-2"></div>
            <div className="h-4 w-full rounded bg-muted mb-2"></div>
            <div className="h-4 w-2/3 rounded bg-muted"></div>
          </div>
        </article>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex items-start gap-14">
        <article className="prose-code:font-code prose-inline-code:before:content-[''] prose-inline-code:after:content-[''] prose flex-1 prose-zinc dark:prose-invert prose-headings:scroll-m-20 prose-pre:border prose-pre:bg-muted/25 prose-img:rounded-md">
          <ArticleBreadcrumb paths={paths} />
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
            Document Not Found
          </h1>
          <div className="prose-content">
            <p className="text-muted-foreground">
              The documentation page for <strong>{slug}</strong> could not be
              found.
            </p>
            <p>
              Expected file at:{" "}
              <code>src/contents/docs/{slug}/index.mdx</code>
            </p>
          </div>
          <Pagination pathname={pathName} />
        </article>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-14">
      <article className="prose-code:font-code prose-inline-code:before:content-[''] prose-inline-code:after:content-[''] prose flex-1 prose-zinc dark:prose-invert prose-headings:scroll-m-20 prose-pre:border prose-pre:bg-muted/25 prose-img:rounded-md">
        <ArticleBreadcrumb paths={paths} />
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
          {title}
        </h1>
        <div className="prose-content">
          <MdxContent code={document.code} />
        </div>
        <Pagination pathname={pathName} />
      </article>
      <TableOfContents
        tocs={{ tocs: document.tocs }}
        pathName={slug}
        frontmatter={document.frontmatter}
      />
    </div>
  )
}

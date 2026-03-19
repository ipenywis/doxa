"use client"

import { createElement, useEffect, useState } from "react"
import * as runtime from "react/jsx-runtime"
import { ArticleBreadcrumb } from "@/src/components/article/breadcrumb"
import { Pagination } from "@/src/components/article/pagination"
import { TableOfContents } from "@/src/components/toc"
import { components } from "@/src/lib/components"
import { fetchDocumentFromServer } from "@/src/lib/markdown"
import { PageRoutes, Routes, isHeading, isRoute } from "@/src/lib/pageroutes"
import { run } from "@mdx-js/mdx"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

export const Route = createFileRoute("/docs/$")({
  validateSearch: z.object({
    _splat: z.string().optional(),
  }),
  loader: async ({ params }) => {
    const firstRoute = PageRoutes[0]?.href?.replace(/^\//, "")
    const slug = params._splat || firstRoute || ""
    if (!slug) {
      return { slug: "", document: null }
    }
    try {
      const document = await fetchDocumentFromServer({ data: slug })
      return { slug, document }
    } catch {
      return { slug, document: null }
    }
  },
  preload: true,
  staleTime: Infinity,
  component: DocsContent,
})

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

function findSectionHeading(slug: string): string | undefined {
  const targetHref = `/${slug}`
  let currentHeading: string | undefined
  for (const route of Routes) {
    if (isHeading(route)) {
      currentHeading = route.heading
    } else if (isRoute(route) && route.href === targetHref) {
      return currentHeading
    }
  }
  return undefined
}

function DocsContent() {
  const { slug, document } = Route.useLoaderData()
  const paths = slug.split("/")
  const pathName = `docs/${slug}`

  const currentRoute = PageRoutes.find((r) => r.href === `/${slug}`)
  const title =
    document?.frontmatter?.title ||
    currentRoute?.title ||
    slug.split("/").pop() ||
    "Documentation"

  const description = document?.frontmatter?.description
  const sectionHeading = findSectionHeading(slug)

  if (!document) {
    return (
      <div key={slug} className="flex animate-in fade-in duration-300 items-start gap-10">
        <article className="prose-code:font-code prose-code:before:content-none prose-code:after:content-none prose max-w-3xl flex-1 prose-zinc dark:prose-invert prose-headings:scroll-m-20 prose-pre:border prose-pre:bg-muted/25 prose-img:rounded-md">
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
    <div key={slug} className="flex animate-in fade-in duration-300 items-start gap-10">
      <article className="prose-code:font-code prose-code:before:content-none prose-code:after:content-none prose max-w-3xl flex-1 prose-zinc dark:prose-invert prose-headings:scroll-m-20 prose-pre:border prose-pre:bg-muted/25 prose-img:rounded-md">
        {sectionHeading && (
          <p className="not-prose mb-2 text-sm font-medium text-primary">
            {sectionHeading}
          </p>
        )}
        <h1 className="not-prose text-3xl font-bold tracking-tight lg:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="not-prose mt-3 text-lg text-muted-foreground">
            {description}
          </p>
        )}
        <div className="prose-content mt-8">
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

"use client"

import type { ComponentType } from "react"
import { useChatContext } from "@/src/components/chat/chat-context"
import { ArticleBreadcrumb } from "@/src/components/article/breadcrumb"
import { Pagination } from "@/src/components/article/pagination"
import { TableOfContents } from "@/src/components/toc"
import { components } from "@/src/lib/components"
import { fetchDocumentFromServer } from "@/src/lib/markdown"
import { PageRoutes, Routes, isHeading, isRoute } from "@/src/lib/pageroutes"
import { Settings } from "@/src/settings/main"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

const mdxModules = import.meta.glob<{
  default: ComponentType<{ components?: typeof components }>
}>("/src/contents/docs/**/index.mdx", { eager: true })

export const Route = createFileRoute("/docs/$")({
  validateSearch: z.object({
    _splat: z.string().optional(),
  }),
  loader: async ({ params }) => {
    const firstRoute = PageRoutes[0]?.href?.replace(/^\//, "")
    const slug = params._splat || firstRoute || ""
    if (!slug) {
      return { slug: "", document: null, routeTitle: null }
    }
    try {
      const document = await fetchDocumentFromServer({ data: slug })
      const routeTitle = PageRoutes.find((r) => r.href === `/${slug}`)?.title ?? null
      return { slug, document, routeTitle }
    } catch {
      return { slug, document: null, routeTitle: null }
    }
  },
  preload: true,
  staleTime: Infinity,
  component: DocsContent,
  ssr: true,
  head: ({ loaderData }) => {
    const slug = loaderData?.slug ?? ""
    const document = loaderData?.document ?? null
    const title = loaderData?.routeTitle || document?.frontmatter?.title
    const description = document?.frontmatter?.description
    const keywords = document?.frontmatter?.keywords

    const pageTitle = title ? `${title} – ${Settings.site.name}` : Settings.site.name
    const pageDescription = description || Settings.site.description
    const pageUrl = `${Settings.site.url}/docs/${slug}`

    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: pageDescription },
        ...(keywords ? [{ name: "keywords", content: keywords }] : []),
        // Open Graph
        { property: "og:type", content: "article" },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: pageDescription },
        { property: "og:url", content: pageUrl },
        // Twitter
        { name: "twitter:title", content: pageTitle },
        { name: "twitter:description", content: pageDescription },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
    }
  },
})

function MdxContent({ slug }: { slug: string }) {
  const mdxModule = mdxModules[`/src/contents/docs/${slug}/index.mdx`]

  if (!mdxModule) {
    return (
      <p className="text-red-500">
        Failed to render content. Please refresh the page.
      </p>
    )
  }

  const MDXContent = mdxModule.default

  return <MDXContent components={components} />
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
  const { isOpen: chatOpen } = useChatContext()
  const { slug, document: pageDocument } = Route.useLoaderData()
  const paths = slug.split("/")
  const pathName = `docs/${slug}`

  const currentRoute = PageRoutes.find((r) => r.href === `/${slug}`)
  const title =
    currentRoute?.title ||
    pageDocument?.frontmatter?.title ||
    slug.split("/").pop() ||
    "Documentation"

  const description = pageDocument?.frontmatter?.description
  const sectionHeading = findSectionHeading(slug)

  if (!pageDocument) {
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
          <MdxContent slug={slug} />
        </div>
        <Pagination pathname={pathName} />
      </article>
      {!chatOpen && (
        <TableOfContents
          tocs={{ tocs: pageDocument.tocs }}
          pathName={slug}
          frontmatter={pageDocument.frontmatter}
        />
      )}
    </div>
  )
}

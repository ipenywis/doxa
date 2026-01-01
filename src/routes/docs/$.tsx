"use client"

import { ArticleBreadcrumb } from "@/src/components/article/breadcrumb"
import { Pagination } from "@/src/components/article/pagination"
import { TableOfContents } from "@/src/components/toc"
import { PageRoutes } from "@/src/lib/pageroutes"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/docs/$")({
  component: DocsContent,
})

function DocsContent() {
  const { _splat } = Route.useParams()
  const slug = _splat || "basic-setup"
  const paths = slug.split("/")
  const pathName = `docs/${slug}`

  // Find the current route to get its title
  const currentRoute = PageRoutes.find((r) => r.href === `/${slug}`)
  const title = currentRoute?.title || slug.split("/").pop() || "Documentation"

  return (
    <div className="flex items-start gap-14">
      <article className="prose-code:font-code prose-inline-code:before:content-[''] prose-inline-code:after:content-[''] prose flex-1 prose-zinc dark:prose-invert prose-headings:scroll-m-20 prose-pre:border prose-pre:bg-muted/25 prose-img:rounded-md">
        <ArticleBreadcrumb paths={paths} />
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
          {title}
        </h1>
        <div className="prose-content">
          <p className="text-muted-foreground">
            This documentation page is being loaded. Content for:{" "}
            <strong>{slug}</strong>
          </p>
          <p>
            View the MDX source at <code>contents/docs/{slug}/index.mdx</code>
          </p>
        </div>
        <Pagination pathname={pathName} />
      </article>
      <TableOfContents
        tocs={{ tocs: [] }}
        pathName={slug}
        frontmatter={{ title }}
      />
    </div>
  )
}

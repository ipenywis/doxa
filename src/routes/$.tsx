import { useEffect, useMemo, type ComponentType } from "react";
import { getDemoRedirectSearch } from "@/src/runtime/demo-search";
import { loadViteDocsRouteData } from "@/src/runtime/vite-route-data";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { z } from "zod";

import type { ChatPageContext } from "@/src/lib/chat-page-context";
import { components } from "@/src/lib/components";
import { ArticleBreadcrumb } from "@/src/components/article/breadcrumb";
import { ChatWithPage } from "@/src/components/article/chat-with-page";
import { CopyPage } from "@/src/components/article/copy-page";
import { Pagination } from "@/src/components/article/pagination";
import { useChatContext } from "@/src/components/chat/chat-context";
import { SectionTabs } from "@/src/components/navigation/section-tabs";
import { Sidebar } from "@/src/components/sidebar";
import { TableOfContents } from "@/src/components/toc";

// `import: "default"` pulls only the compiled React component, skipping the
// sibling `__rawSource` export injected by mdxSourceCapturePlugin. This keeps
// the raw MDX strings out of the client bundle — they ship only in the SSR
// bundle where `vite-adapter.ts` references them.
const mdxModules = import.meta.glob<
  ComponentType<{ components?: typeof components }>
>("/src/contents/docs/**/index.mdx", { eager: true, import: "default" });

export const Route = createFileRoute("/$")({
  validateSearch: z.object({
    _splat: z.string().optional(),
    demo: z.union([z.boolean(), z.string(), z.number()]).optional(),
  }),
  loader: async ({ location, params }) => {
    const pathname = params._splat ? `/${params._splat}` : location.pathname;
    const demoSearch = getDemoRedirectSearch(location.search);
    const data = await loadViteDocsRouteData({ data: { pathname } });

    if (data.type === "redirect") {
      throw redirect({ to: data.href, ...demoSearch });
    }

    if (data.type === "router_not_found") {
      throw notFound();
    }

    return data;
  },
  preload: true,
  staleTime: Infinity,
  component: DocsContent,
  ssr: true,
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {};
    }

    const document = loaderData?.document ?? null;
    const title = loaderData?.routeTitle || document?.frontmatter.title;
    const description = document?.frontmatter?.description;
    const keywords = document?.frontmatter?.keywords;

    const pageTitle = title
      ? `${title} – ${loaderData.site.name}`
      : loaderData.site.name;
    const pageDescription = description || loaderData.site.description || "";
    const pageUrl = loaderData.canonicalUrl;

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
    };
  },
});

function MdxContent({ slug }: { slug: string }) {
  // Two-pass lookup mirrors the content adapters' canonicalization
  // (see src/lib/content/adapters/vite-adapter.ts:toCanonicalPath).
  // Default-section pages live physically under `default/<page>/index.mdx`
  // but are served at rootless URLs `/<page>`. Non-default sections keep
  // their slug prefix on disk and in the URL.
  //
  // Order matters: rootless first wins so that a slug like "configuration"
  // resolves to the file at `default/configuration/index.mdx` after the
  // canonical-location lookup misses.
  const MDXContent =
    mdxModules[`/src/contents/docs/${slug}/index.mdx`] ??
    mdxModules[`/src/contents/docs/default/${slug}/index.mdx`];

  if (!MDXContent) {
    return (
      <p className="text-red-500">
        Failed to render content. Please refresh the page.
      </p>
    );
  }

  return <MDXContent components={components} />;
}

function DocsContent() {
  const { isOpen: chatOpen, setCurrentPageContext } = useChatContext();
  const loaderData = Route.useLoaderData();
  const { slug, document: pageDocument, rawDoc } = loaderData;
  const paths = slug.split("/");
  const pathName = slug;

  const title =
    loaderData.routeTitle ||
    pageDocument?.frontmatter?.title ||
    slug.split("/").pop() ||
    "Documentation";

  const description = pageDocument?.frontmatter?.description;
  const sectionHeading = loaderData.sectionHeading;
  const copyPageEnabled =
    loaderData.features.copyPage.markdown ||
    loaderData.features.copyPage.rawText;
  const pageContext = useMemo<ChatPageContext | null>(() => {
    if (!slug || !pageDocument) return null;

    return {
      slug,
      href: pageDocument.href,
      sourcePath: pageDocument.sourcePath,
      title,
      ...(description ? { description } : {}),
    };
  }, [description, pageDocument, slug, title]);

  useEffect(() => {
    setCurrentPageContext(pageContext);
  }, [pageContext, setCurrentPageContext]);

  const article = !pageDocument ? (
    <div key={slug} className="flex items-start gap-6 lg:gap-10">
      <article className="prose-code:font-code @container/article prose w-full max-w-3xl min-w-0 flex-1 prose-zinc dark:prose-invert prose-headings:scroll-m-20 prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:bg-muted/25 prose-img:rounded-md">
        <ArticleBreadcrumb paths={paths} homeHref={loaderData.homeHref} />
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
          Document Not Found
        </h1>
        <div className="prose-content">
          <p className="text-muted-foreground">
            The documentation page for <strong>{slug}</strong> could not be
            found.
          </p>
          <p>
            Expected file at: <code>src/contents/docs/{slug}/index.mdx</code>
          </p>
        </div>
        <Pagination
          pathname={pathName}
          previous={loaderData.previous}
          next={loaderData.next}
        />
      </article>
    </div>
  ) : (
    <div key={slug} className="flex items-start gap-6 lg:gap-10">
      <article className="prose-code:font-code @container/article prose w-full max-w-3xl min-w-0 flex-1 prose-zinc dark:prose-invert prose-headings:scroll-m-20 prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:bg-muted/25 prose-img:rounded-md">
        {sectionHeading && (
          <p className="not-prose mb-2 text-sm font-medium text-primary">
            {sectionHeading}
          </p>
        )}
        <div className="not-prose flex flex-col gap-3 @2xl/article:flex-row @2xl/article:items-start @2xl/article:justify-between">
          <h1 className="min-w-0 text-3xl font-bold tracking-tight lg:text-4xl">
            {title}
          </h1>
          <div className="flex shrink-0 flex-wrap items-center gap-2 @2xl/article:order-last">
            {loaderData.features.ai.chat &&
              loaderData.features.ai.chatWithPage &&
              pageContext && <ChatWithPage pageContext={pageContext} />}
            {copyPageEnabled && (
              <CopyPage
                options={loaderData.features.copyPage}
                rawDoc={rawDoc}
                title={title}
                description={description}
              />
            )}
          </div>
        </div>
        {description && (
          <p className="not-prose mt-3 text-lg text-muted-foreground">
            {description}
          </p>
        )}
        <div className="prose-content mt-8">
          <MdxContent slug={slug} />
        </div>
        <Pagination
          pathname={pathName}
          previous={loaderData.previous}
          next={loaderData.next}
        />
      </article>
      {!chatOpen && (
        <TableOfContents
          tocs={{ tocs: pageDocument.tocs }}
          pathName={slug}
          frontmatter={pageDocument.frontmatter}
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col">
      <SectionTabs
        sections={loaderData.sections}
        currentSectionSlug={loaderData.currentSection?.slug ?? null}
        sectionHomeHrefs={loaderData.sectionHomeHrefs}
      />
      <div className="flex items-start gap-4 md:gap-8 lg:gap-12">
        <Sidebar
          section={loaderData.currentSection}
          routes={loaderData.sectionNavigation}
        />
        <div className="min-w-0 flex-1 pt-6">{article}</div>
      </div>
    </div>
  );
}

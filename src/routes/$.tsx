import { useEffect, useMemo, type ComponentType } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { Settings } from "@/src/settings/main";
import { getSectionFromPath } from "@/src/settings/sections";
import type { ChatPageContext } from "@/src/lib/chat-page-context";
import { components } from "@/src/lib/components";
import { fetchDocumentFromServer, fetchRawDocument } from "@/src/lib/markdown";
import {
  getPageRoutesForSection,
  getRoutesForSection,
  isHeading,
  isRoute,
  PageRoutes,
  type Paths,
} from "@/src/lib/pageroutes";
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

function isDemoSearch(search: Record<string, unknown>): boolean {
  return (
    search.demo === true ||
    search.demo === "true" ||
    search.demo === "" ||
    search.demo === 1 ||
    search.demo === "1"
  );
}

export const Route = createFileRoute("/$")({
  validateSearch: z.object({
    _splat: z.string().optional(),
  }),
  loader: async ({ location, params }) => {
    const slug = params._splat ?? "";
    if (!slug) {
      const firstRoute = PageRoutes[0]?.href;
      if (firstRoute) {
        throw redirect({
          to: firstRoute,
          ...(isDemoSearch(location.search)
            ? { search: { demo: true as const } }
            : {}),
        });
      }
      return { slug: "", document: null, routeTitle: null, rawDoc: null };
    }
    try {
      const document = await fetchDocumentFromServer({ data: slug });
      const section = getSectionFromPath(`/${slug}`);
      const sectionPages = getPageRoutesForSection(section.slug);
      const routeTitle =
        sectionPages.find((r) => r.href === `/${slug}`)?.title ?? null;
      // Deferred: not awaited. Streams in after initial HTML so copy-page can
      // read from a resolved promise on first interaction without blocking SSR.
      const rawDoc = Settings.features.copyPage.markdown
        ? fetchRawDocument({ data: slug }).catch(() => null)
        : null;
      return { slug, document, routeTitle, rawDoc };
    } catch {
      return { slug, document: null, routeTitle: null, rawDoc: null };
    }
  },
  preload: true,
  staleTime: Infinity,
  component: DocsContent,
  ssr: true,
  head: ({ loaderData }) => {
    const slug = loaderData?.slug ?? "";
    const document = loaderData?.document ?? null;
    const title = loaderData?.routeTitle || document?.frontmatter?.title;
    const description = document?.frontmatter?.description;
    const keywords = document?.frontmatter?.keywords;

    const pageTitle = title
      ? `${title} – ${Settings.site.name}`
      : Settings.site.name;
    const pageDescription = description || Settings.site.description;
    const pageUrl = `${Settings.site.url}/${slug}`;

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
  const MDXContent = mdxModules[`/src/contents/docs/${slug}/index.mdx`];

  if (!MDXContent) {
    return (
      <p className="text-red-500">
        Failed to render content. Please refresh the page.
      </p>
    );
  }

  return <MDXContent components={components} />;
}

function findSectionHeading(slug: string): string | undefined {
  const targetHref = `/${slug}`;
  const section = getSectionFromPath(targetHref);
  const routes: Paths[] = getRoutesForSection(section.slug);
  let currentHeading: string | undefined;
  for (const route of routes) {
    if (isHeading(route)) {
      currentHeading = route.heading;
    } else if (isRoute(route) && route.href === targetHref) {
      return currentHeading;
    }
  }
  return undefined;
}

function DocsContent() {
  const { isOpen: chatOpen, setCurrentPageContext } = useChatContext();
  const { slug, document: pageDocument, rawDoc } = Route.useLoaderData();
  const paths = slug.split("/");
  const pathName = slug;

  const currentSection = getSectionFromPath(`/${slug}`);
  const currentSectionPages = getPageRoutesForSection(currentSection.slug);
  const currentRoute = currentSectionPages.find((r) => r.href === `/${slug}`);
  const title =
    currentRoute?.title ||
    pageDocument?.frontmatter?.title ||
    slug.split("/").pop() ||
    "Documentation";

  const description = pageDocument?.frontmatter?.description;
  const sectionHeading = findSectionHeading(slug);
  const copyPageEnabled =
    Settings.features.copyPage.markdown || Settings.features.copyPage.rawText;
  const pageContext = useMemo<ChatPageContext | null>(() => {
    if (!slug || !pageDocument) return null;

    return {
      slug,
      href: `/${slug}`,
      sourcePath: `${slug}/index.mdx`,
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
            Expected file at: <code>src/contents/docs/{slug}/index.mdx</code>
          </p>
        </div>
        <Pagination pathname={pathName} />
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
            {Settings.features.ai.chat &&
              Settings.features.ai.chatWithPage &&
              pageContext && <ChatWithPage pageContext={pageContext} />}
            {copyPageEnabled && (
              <CopyPage
                options={Settings.features.copyPage}
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
  );

  return (
    <div className="flex flex-col">
      <SectionTabs />
      <div className="flex items-start gap-4 md:gap-8 lg:gap-12">
        <Sidebar />
        <div className="min-w-0 flex-1 pt-6">{article}</div>
      </div>
    </div>
  );
}

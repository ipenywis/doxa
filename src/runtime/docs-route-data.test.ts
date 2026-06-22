import { describe, expect, test } from "vitest";

import { getDemoRedirectSearch } from "./demo-search";
import {
  findSectionHeadingFromRuntimeNavigation,
  getDocsRouteDataFromMatches,
  getPreviousNextFromRuntimeRoutes,
  resolveDocsRootRouteData,
  resolveDocsRouteData,
} from "./docs-route-data";
import {
  filterLinkableRuntimePages,
  normalizeRuntimeHref,
  normalizeRuntimeSlug,
  type DoxaDocsRuntimeSource,
  type RuntimeFeatureConfig,
  type RuntimeNavNode,
  type RuntimePage,
  type RuntimeRawPage,
  type RuntimeSection,
} from "./runtime-source";

describe("docs route data", () => {
  test("resolves root route data as a home redirect", async () => {
    const source = createFakeRuntimeSource();

    await expect(resolveDocsRouteData(source, "/")).resolves.toMatchObject({
      type: "redirect",
      href: "/overview",
      status: 308,
    });

    await expect(resolveDocsRootRouteData(source)).resolves.toMatchObject({
      type: "redirect",
      href: "/overview",
      status: 308,
    });
  });

  test("preserves demo search payload for redirects", () => {
    expect(getDemoRedirectSearch({ demo: "" })).toEqual({
      search: { demo: true },
    });
    expect(getDemoRedirectSearch({ demo: "false" })).toEqual({});
  });

  test("marks default-prefixed pages for router notFound", async () => {
    await expect(
      resolveDocsRouteData(createFakeRuntimeSource(), "/default/overview")
    ).resolves.toMatchObject({
      type: "router_not_found",
      href: "/default/overview",
      slug: "default/overview",
    });
  });

  test("keeps ordinary missing pages as in-page not-found data", async () => {
    const data = await resolveDocsRouteData(
      createFakeRuntimeSource(),
      "/missing"
    );

    expect(data).toMatchObject({
      type: "not_found",
      href: "/missing",
      slug: "missing",
      document: null,
      rawDoc: null,
    });
  });

  test("resolves page metadata, toc, canonical URL, routes, and raw copy data", async () => {
    const data = await resolveDocsRouteData(
      createFakeRuntimeSource(),
      "/overview",
      { includeRawDocument: true }
    );

    expect(data.type).toBe("page");
    if (data.type !== "page") return;

    expect(data.document).toMatchObject({
      href: "/overview",
      slug: "overview",
      sourcePath: "overview/index.mdx",
      frontmatter: {
        title: "Overview",
        description: "Start here.",
        keywords: "intro, doxa",
      },
      tocs: [{ level: 2, text: "Install", href: "#install" }],
    });
    expect(data.routeTitle).toBe("Overview Route");
    expect(data.sectionHeading).toBe("Start");
    expect(data.canonicalUrl).toBe("https://docs.example.com/overview");
    expect(data.homeHref).toBe("/overview");
    expect(data.rawDoc?.body.trim()).toBe("# Overview\n\nBody.");
    expect(data.previous).toBeNull();
    expect(data.next?.href).toBe("/guide");
    expect(data.sectionRoutes.map((route) => route.href)).toEqual([
      "/overview",
      "/guide",
      "/advanced",
    ]);
  });

  test("excludes raw document data from normal route data by default", async () => {
    let rawPageCalls = 0;
    const source = createFakeRuntimeSource({
      async getRawPage(slugOrHref) {
        rawPageCalls++;
        return rawPages[normalizeRuntimeHref(slugOrHref)] ?? null;
      },
    });

    const data = await resolveDocsRouteData(source, "/overview");

    expect(data.type).toBe("page");
    if (data.type !== "page") return;
    expect(data.rawDoc).toBeNull();
    expect(rawPageCalls).toBe(0);
  });

  test("keeps page data available when raw copy loading fails", async () => {
    const source = createFakeRuntimeSource({
      async getRawPage() {
        throw new Error("raw copy unavailable");
      },
    });

    const data = await resolveDocsRouteData(source, "/overview", {
      includeRawDocument: true,
    });

    expect(data.type).toBe("page");
    if (data.type !== "page") return;
    expect(data.document?.href).toBe("/overview");
    expect(data.rawDoc).toBeNull();
  });

  test("flattens nested section navigation for sidebar consumers", async () => {
    const nestedNavigation: RuntimeNavNode[] = [
      { heading: "Start" },
      {
        title: "Guide",
        href: "/guide",
        items: [{ title: "Install", href: "/install" }],
      },
    ];
    const source = createFakeRuntimeSource({
      async getNavigation(sectionSlug) {
        return sectionSlug === "docs" ? nestedNavigation : [];
      },
      async getRoutes(sectionSlug) {
        return filterLinkableRuntimePages(
          sectionSlug === "docs" ? nestedNavigation : []
        );
      },
    });

    const data = await resolveDocsRouteData(source, "/guide");

    expect(data.type).toBe("page");
    if (data.type !== "page") return;
    expect(data.sectionNavigation).toEqual([
      { heading: "Start" },
      { title: "Guide", href: "/guide" },
      { title: "Install", href: "/guide/install" },
    ]);
    expect(data.sectionRoutes.map((route) => route.href)).toEqual([
      "/guide",
      "/guide/install",
    ]);
  });

  test("selects docs route data from router matches for root-level navigation", async () => {
    const data = await resolveDocsRouteData(
      createFakeRuntimeSource(),
      "/overview"
    );

    expect(
      getDocsRouteDataFromMatches([
        { loaderData: { type: "empty" } },
        { loaderData: data },
      ])
    ).toBe(data);
    expect(
      getDocsRouteDataFromMatches([
        { loaderData: null },
        { loaderData: { type: "redirect", href: "/overview", status: 308 } },
      ])
    ).toBeNull();
  });

  test("derives section headings and pagination from runtime navigation/routes", async () => {
    const source = createFakeRuntimeSource();
    const navigation = await source.getNavigation("docs");
    const routes = await source.getRoutes("docs");

    expect(
      findSectionHeadingFromRuntimeNavigation(navigation, "/advanced")
    ).toBe("Deep Dive");

    expect(getPreviousNextFromRuntimeRoutes(routes, "/guide")).toMatchObject({
      previous: { href: "/overview" },
      next: { href: "/advanced" },
    });
  });

  test("returns runtime-source section-root redirects", async () => {
    await expect(
      resolveDocsRouteData(createFakeRuntimeSource(), "/guides")
    ).resolves.toMatchObject({
      type: "redirect",
      href: "/guides/start",
      status: 308,
    });
  });
});

const sections: RuntimeSection[] = [
  { slug: "docs", label: "Docs", default: true },
  { slug: "guides", label: "Guides" },
];

const navigationBySection: Record<string, RuntimeNavNode[]> = {
  docs: [
    { heading: "Start" },
    { title: "Overview Route", href: "/overview" },
    { title: "Guide", href: "/guide" },
    { heading: "Deep Dive" },
    { title: "Advanced", href: "/advanced" },
  ],
  guides: [
    { heading: "Guides" },
    { title: "Guides Start", href: "/guides/start" },
  ],
};

const pages: Record<string, RuntimePage> = {
  "/overview": createPage({
    href: "/overview",
    title: "Overview",
    description: "Start here.",
    keywords: ["intro", "doxa"],
    headings: [{ level: 2, text: "Install", href: "#install" }],
  }),
  "/guide": createPage({ href: "/guide", title: "Guide" }),
  "/advanced": createPage({ href: "/advanced", title: "Advanced" }),
  "/guides/start": createPage({
    href: "/guides/start",
    title: "Guides Start",
    sectionSlug: "guides",
  }),
};

const rawPages: Record<string, RuntimeRawPage> = Object.fromEntries(
  Object.values(pages).map((page) => [
    page.href,
    {
      slug: page.slug,
      href: page.href,
      title: page.title,
      description: page.description,
      sourcePath: page.sourcePath,
      body: `---\ntitle: ${page.title}\n---\n\n# ${page.title}\n\nBody.`,
    },
  ])
);

function createFakeRuntimeSource(
  overrides: Partial<DoxaDocsRuntimeSource> = {}
): DoxaDocsRuntimeSource {
  const source: DoxaDocsRuntimeSource = {
    async getSiteConfig() {
      return {
        name: "Doxa Test",
        description: "Generated docs.",
        url: "https://docs.example.com/",
      };
    },
    async getCompanyConfig() {
      return { name: "Doxa", link: "https://docs.example.com" };
    },
    async getSocialConfig() {
      return {
        twitterHandle: "",
        openGraph: {
          type: "website",
          title: "Doxa",
          description: "Generated docs.",
          siteName: "Doxa",
          images: [],
        },
        twitter: {
          card: "summary_large_image",
          title: "Doxa",
          description: "Generated docs.",
          site: "",
          images: [],
        },
      };
    },
    async getThemeConfig() {
      return { primaryColor: "default", activeTheme: "default" };
    },
    async getFeatureConfig() {
      return featureConfig;
    },
    async getSections() {
      return sections;
    },
    async getNavigation(sectionSlug) {
      return navigationBySection[sectionSlug] ?? [];
    },
    async getRoutes(sectionSlug) {
      return filterLinkableRuntimePages(navigationBySection[sectionSlug] ?? []);
    },
    async getHomeHref() {
      return "/overview";
    },
    async resolvePage(pathname) {
      const href = normalizeRuntimeHref(pathname);
      const slug = normalizeRuntimeSlug(href);

      if (href === "/") {
        return { type: "redirect", href: "/overview", status: 308 };
      }

      if (slug === "default" || slug.startsWith("default/")) {
        return { type: "not_found", href, slug };
      }

      if (href === "/guides") {
        return { type: "redirect", href: "/guides/start", status: 308 };
      }

      const page = pages[href];
      return page
        ? { type: "page", href, slug, page }
        : { type: "not_found", href, slug };
    },
    async getPage(slugOrHref) {
      return pages[normalizeRuntimeHref(slugOrHref)] ?? null;
    },
    async getRawPage(slugOrHref) {
      return rawPages[normalizeRuntimeHref(slugOrHref)] ?? null;
    },
    async getSearchIndex() {
      return null;
    },
  };

  return { ...source, ...overrides };
}

function createPage({
  href,
  title,
  description = "",
  keywords = [],
  headings = [],
  sectionSlug = "docs",
}: Pick<RuntimePage, "href" | "title"> &
  Partial<
    Pick<RuntimePage, "description" | "keywords" | "headings" | "sectionSlug">
  >): RuntimePage {
  const slug = normalizeRuntimeSlug(href);

  return {
    slug,
    href,
    title,
    description,
    keywords,
    sectionSlug,
    sourcePath: `${slug}/index.mdx`,
    body: `---\ntitle: ${title}\n---\n\n# ${title}`,
    headings,
  };
}

const featureConfig: RuntimeFeatureConfig = {
  branding: true,
  rightSidebar: true,
  feedbackEdit: true,
  tableOfContents: true,
  scrollToTop: true,
  ai: {
    chat: true,
    chatWithPage: true,
    floatingInput: true,
  },
  copyPage: {
    markdown: true,
    rawText: true,
  },
  rawMarkdown: true,
  loadFromGithub: false,
};

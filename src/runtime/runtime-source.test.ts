import { describe, expect, test } from "vitest";

import {
  filterLinkableRuntimePages,
  flattenRuntimeNavigation,
  getRuntimeDefaultSection,
  getRuntimeSectionFromHref,
  normalizeRuntimeBasePath,
  normalizeRuntimeHref,
  normalizeRuntimeSlug,
  type RuntimeNavNode,
  type RuntimeNavPage,
  type RuntimeSection,
} from "./index";
import { createViteRuntimeSource, viteRuntimeSource } from "./vite";
import {
  createRuntimeNavigation,
  createRuntimeRoutes,
} from "./vite-runtime-source";

describe("runtime source helpers", () => {
  test("normalizes hrefs, slugs, base paths, and index-ish values", () => {
    expect(normalizeRuntimeHref("overview")).toBe("/overview");
    expect(normalizeRuntimeHref("/overview/")).toBe("/overview");
    expect(normalizeRuntimeHref("docs\\quickstart\\")).toBe("/docs/quickstart");
    expect(normalizeRuntimeHref("/overview/index")).toBe("/overview");
    expect(normalizeRuntimeHref("index.mdx")).toBe("/");
    expect(normalizeRuntimeHref("/")).toBe("/");

    expect(normalizeRuntimeSlug("/overview/index.mdx")).toBe("overview");
    expect(normalizeRuntimeSlug("/")).toBe("");

    expect(normalizeRuntimeBasePath("/docs/")).toBe("/docs");
    expect(normalizeRuntimeBasePath("")).toBe("");
    expect(normalizeRuntimeBasePath("/")).toBe("");
  });

  test("finds the default section and section for an href", () => {
    const sections: RuntimeSection[] = [
      { slug: "documentation", label: "Documentation", default: true },
      { slug: "rest-api", label: "REST API" },
    ];

    expect(getRuntimeDefaultSection(sections)?.slug).toBe("documentation");
    expect(getRuntimeSectionFromHref(sections, "/overview")?.slug).toBe(
      "documentation"
    );
    expect(
      getRuntimeSectionFromHref(sections, "/rest-api/messages")?.slug
    ).toBe("rest-api");
  });

  test("flattens nested navigation and filters linkable pages", () => {
    const navigation: RuntimeNavNode[] = [
      { heading: "Start" },
      {
        title: "Guide",
        href: "/guide",
        items: [
          { title: "Draft", href: "/draft", noLink: true },
          { heading: "Nested" },
          { spacer: true },
          { title: "Install", href: "/install", badge: "New" },
        ],
      },
      { spacer: true },
    ];

    const flattened = flattenRuntimeNavigation(navigation);
    expect(flattened).toEqual([
      { heading: "Start" },
      { title: "Guide", href: "/guide" },
      { title: "Draft", href: "/guide/draft", noLink: true },
      { heading: "Nested" },
      { spacer: true },
      { title: "Install", href: "/guide/install", badge: "New" },
      { spacer: true },
    ]);

    expect(
      filterLinkableRuntimePages(navigation).map((page) => page.href)
    ).toEqual(["/guide", "/guide/install"]);
  });
});

describe("viteRuntimeSource", () => {
  test("returns a non-null home href for the current template content", async () => {
    await expect(viteRuntimeSource.getHomeHref()).resolves.toMatch(/^\/.+/);
  });

  test("resolves pages when resolvePage is destructured", async () => {
    const source = createViteRuntimeSource();
    const { resolvePage } = source;
    const homeHref = await source.getHomeHref();

    await expect(resolvePage("/")).resolves.toMatchObject({
      type: "redirect",
      href: homeHref,
      status: 308,
    });
  });

  test("resolves the root path as a redirect", async () => {
    const homeHref = await viteRuntimeSource.getHomeHref();
    const resolution = await viteRuntimeSource.resolvePage("/");

    expect(resolution).toMatchObject({
      type: "redirect",
      href: homeHref,
      status: 308,
    });
  });

  test("does not expose default-prefixed pages as runtime routes", async () => {
    await expect(
      viteRuntimeSource.resolvePage("/default/overview")
    ).resolves.toMatchObject({
      type: "not_found",
      href: "/default/overview",
      slug: "default/overview",
    });
  });

  test("resolves the home href as a page", async () => {
    const homeHref = await getRequiredHomeHref();
    const resolution = await viteRuntimeSource.resolvePage(homeHref);

    expect(resolution.type).toBe("page");
    if (resolution.type === "page") {
      expect(resolution.page.href).toBe(homeHref);
      expect(resolution.page.body).toContain("#");
    }
  });

  test("loads runtime page content and metadata", async () => {
    const homeHref = await getRequiredHomeHref();
    const page = await viteRuntimeSource.getPage(homeHref);

    expect(page).toMatchObject({
      href: homeHref,
      sourcePath: expect.stringMatching(/index\.mdx$/),
    });
    expect(page?.title).toEqual(expect.any(String));
    expect(page?.title.length).toBeGreaterThan(0);
    expect(page?.body).toContain("#");
    expect(page?.body.trimStart().startsWith("---")).toBe(true);
  });

  test("loads raw page content", async () => {
    const homeHref = await getRequiredHomeHref();
    const rawPage = await viteRuntimeSource.getRawPage(homeHref);

    expect(rawPage).toMatchObject({
      href: homeHref,
      sourcePath: expect.stringMatching(/index\.mdx$/),
    });
    expect(rawPage?.title.length).toBeGreaterThan(0);
    expect(rawPage?.body).toContain("#");
    expect(rawPage?.body.trimStart().startsWith("---")).toBe(true);
  });

  test("returns the bundled search index as a JSON-ish string", async () => {
    const searchIndex = await viteRuntimeSource.getSearchIndex();

    expect(searchIndex).toEqual(expect.any(String));
    expect(searchIndex?.trim().startsWith("{")).toBe(true);
    expect(JSON.parse(searchIndex ?? "{}")).toHaveProperty("documentCount");
  });

  test("returns default-section navigation with real routes", async () => {
    const sections = await viteRuntimeSource.getSections();
    const defaultSection = getRuntimeDefaultSection(sections);
    expect(defaultSection).not.toBeNull();

    const navigation = await viteRuntimeSource.getNavigation(
      defaultSection?.slug ?? ""
    );
    const pages = navigation.filter(isRuntimeNavPage);

    expect(pages.length).toBeGreaterThan(0);
    expect(pages.some((page) => page.href === "/overview")).toBe(true);
  });

  test("returns linkable routes derived from runtime navigation", async () => {
    const sections = await viteRuntimeSource.getSections();
    const defaultSection = getRuntimeDefaultSection(sections);
    expect(defaultSection).not.toBeNull();

    const navigation = await viteRuntimeSource.getNavigation(
      defaultSection?.slug ?? ""
    );
    const routes = await viteRuntimeSource.getRoutes(
      defaultSection?.slug ?? ""
    );

    expect(routes).toEqual(filterLinkableRuntimePages(navigation));
    expect(routes.some((page) => page.href === "/overview")).toBe(true);
  });

  test("preserves nested raw document navigation and derives flat routes", () => {
    const navigation = createRuntimeNavigation([
      { heading: "Guides" },
      {
        title: "Guide",
        href: "/guide",
        icon: "book",
        badge: "Beta",
        heading: "Primary",
        items: [
          {
            title: "Draft",
            href: "/draft",
            noLink: true,
            items: [{ title: "Private Notes", href: "/notes" }],
          },
          { heading: "Nested" },
          { spacer: true },
          { title: "Install", href: "/install", icon: "rocket" },
        ],
      },
    ]);

    expect(navigation).toEqual([
      { heading: "Guides" },
      {
        title: "Guide",
        href: "/guide",
        icon: "book",
        badge: "Beta",
        heading: "Primary",
        items: [
          {
            title: "Draft",
            href: "/draft",
            noLink: true,
            items: [{ title: "Private Notes", href: "/notes" }],
          },
          { heading: "Nested" },
          { spacer: true },
          { title: "Install", href: "/install", icon: "rocket" },
        ],
      },
    ]);

    expect(createRuntimeRoutes(navigation)).toEqual([
      {
        title: "Guide",
        href: "/guide",
        icon: "book",
        badge: "Beta",
        heading: "Primary",
      },
      { title: "Private Notes", href: "/guide/draft/notes" },
      { title: "Install", href: "/guide/install", icon: "rocket" },
    ]);
  });
});

async function getRequiredHomeHref(): Promise<string> {
  const homeHref = await viteRuntimeSource.getHomeHref();
  expect(homeHref).not.toBeNull();
  return homeHref ?? "/";
}

function isRuntimeNavPage(node: RuntimeNavNode): node is RuntimeNavPage {
  return "title" in node && "href" in node;
}

import type { ContentAdapter } from "../lib/content/types";
import { renderRuntimeMdx } from "./runtime-mdx";
import type { RuntimeNavPage } from "./runtime-source";
import type {
  RuntimeRenderInput,
  RuntimeRenderResult,
  RuntimeSiteConfig,
} from "./site-config";

export interface RouteRendererConfig {
  contentAdapter: ContentAdapter;
  siteConfig: RuntimeSiteConfig;
}

export async function renderDocsRoute(
  config: RouteRendererConfig,
  input: RuntimeRenderInput
): Promise<RuntimeRenderResult> {
  const docsPath = normalizeHref(input.docsPath);
  const basePath = normalizeBasePath(input.basePath);
  const navigation = await readNavigation(config.contentAdapter);
  const sourcePath = hrefToFilePath(docsPath);
  const source = await config.contentAdapter.readFile(sourcePath);

  if (!source) {
    return renderShell({
      status: 404,
      siteConfig: config.siteConfig,
      basePath,
      title: "Page not found",
      navigation,
      currentHref: docsPath,
      body: `
        <p class="doxa-eyebrow">404</p>
        <h1>Page not found</h1>
        <p>This page is not part of the current published docs version.</p>
      `,
    });
  }

  const rendered = await renderRuntimeMdx(source);
  const title =
    rendered.frontmatter.title ??
    navigation.find((page) => page.href === docsPath)?.title ??
    config.siteConfig.name;

  return renderShell({
    status: 200,
    siteConfig: config.siteConfig,
    basePath,
    title,
    description: rendered.frontmatter.description,
    navigation,
    currentHref: docsPath,
    body: rendered.html,
  });
}

export function renderStatusPage(input: {
  siteConfig: RuntimeSiteConfig;
  basePath?: string;
  status: number;
  eyebrow: string;
  title: string;
  message: string;
}): RuntimeRenderResult {
  return renderShell({
    status: input.status,
    siteConfig: input.siteConfig,
    basePath: normalizeBasePath(input.basePath),
    title: input.title,
    navigation: [],
    currentHref: "/",
    body: `
      <p class="doxa-eyebrow">${escapeHtml(input.eyebrow)}</p>
      <h1>${escapeHtml(input.title)}</h1>
      <p>${escapeHtml(input.message)}</p>
    `,
  });
}

async function readNavigation(
  adapter: ContentAdapter
): Promise<RuntimeNavPage[]> {
  const raw = await adapter.readFile("settings/documents.json");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const pages = parsed.filter(isRuntimeNavPage).map((page) => ({
          title: page.title,
          href: normalizeHref(page.href),
        }));
        if (pages.length > 0) return pages;
      }
    } catch {
      // Fall back to file list.
    }
  }

  const paths = await adapter.listFiles();
  return paths
    .filter((path) => path.endsWith(".mdx"))
    .map((path) => ({
      title: titleFromPath(path),
      href: filePathToHref(path),
    }));
}

function renderShell(input: {
  status: number;
  siteConfig: RuntimeSiteConfig;
  basePath: string;
  title: string;
  description?: string;
  navigation: RuntimeNavPage[];
  currentHref: string;
  body: string;
}): RuntimeRenderResult {
  const title = `${input.title} - ${input.siteConfig.name}`;
  const canonical = `${input.siteConfig.url.replace(/\/+$/, "")}${input.basePath}${input.currentHref === "/" ? "" : input.currentHref}`;

  return {
    status: input.status,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttribute(input.description ?? input.siteConfig.description ?? "")}" />
  <link rel="canonical" href="${escapeAttribute(canonical)}" />
  <style>${runtimeCss}</style>
</head>
<body>
  <div class="doxa-app">
    <header class="doxa-header">
      <a class="doxa-brand" href="${escapeAttribute(input.basePath || "/")}">${escapeHtml(input.siteConfig.name)}</a>
      <span class="doxa-powered">Doxa Docs</span>
    </header>
    <div class="doxa-layout">
      <aside class="doxa-sidebar">${renderNav(input.basePath, input.navigation, input.currentHref)}</aside>
      <main class="doxa-content">
        <article class="doxa-prose">${input.body}</article>
      </main>
    </div>
  </div>
</body>
</html>`,
  };
}

function renderNav(
  basePath: string,
  pages: RuntimeNavPage[],
  currentHref: string
): string {
  const items = pages.map((page) => {
    const href = `${basePath}${page.href === "/" ? "" : page.href}` || "/";
    const active = page.href === currentHref ? "true" : "false";
    return `<a data-active="${active}" href="${escapeAttribute(href)}">${escapeHtml(page.title)}</a>`;
  });

  return `<nav>${items.join("")}</nav>`;
}

function isRuntimeNavPage(value: unknown): value is RuntimeNavPage {
  const candidate = value as Partial<RuntimeNavPage> | null;
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof candidate.title === "string" &&
    typeof candidate.href === "string"
  );
}

function hrefToFilePath(href: string): string {
  const clean = href.replace(/^\/+/, "").replace(/\/+$/, "");
  return clean ? `${clean}/index.mdx` : "index.mdx";
}

function filePathToHref(path: string): string {
  const clean = path
    .replace(/^source\//, "")
    .replace(/^index\.mdx$/, "")
    .replace(/\/index\.mdx$/, "")
    .replace(/\.mdx$/, "")
    .replace(/^\/+/, "");
  return clean ? `/${clean}` : "/";
}

function normalizeHref(value: string): string {
  const clean = value
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  return clean ? `/${clean}` : "/";
}

function normalizeBasePath(value?: string): string {
  if (!value) return "";
  const clean = value
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  return clean ? `/${clean}` : "";
}

function titleFromPath(path: string): string {
  const href = filePathToHref(path);
  if (href === "/") return "Overview";
  return href
    .split("/")
    .filter(Boolean)
    .at(-1)!
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

const runtimeCss = `
:root{color-scheme:dark;--bg:#050505;--panel:#0b0b0b;--text:#f5f5f5;--muted:#8a8a8a;--line:#242424;--accent:#1e88ff;--danger:#ff5f6d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
a{color:inherit}.doxa-app{min-height:100vh}.doxa-header{height:68px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 clamp(20px,5vw,72px);background:rgba(5,5,5,.9);position:sticky;top:0;z-index:10;backdrop-filter:blur(12px)}
.doxa-brand{font-weight:800;letter-spacing:.24em;text-transform:uppercase;text-decoration:none}.doxa-powered{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.22em}
.doxa-layout{display:grid;grid-template-columns:280px minmax(0,1fr);gap:48px;width:min(1280px,100%);margin:0 auto;padding:42px clamp(20px,5vw,56px)}
.doxa-sidebar{position:sticky;top:110px;align-self:start;border:1px solid var(--line);background:var(--panel);padding:12px}.doxa-sidebar nav{display:flex;flex-direction:column;gap:4px}.doxa-sidebar a{padding:10px 12px;text-decoration:none;color:var(--muted);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;border:1px solid transparent}.doxa-sidebar a[data-active=true]{color:var(--text);border-color:var(--accent);background:#07111f}
.doxa-content{min-width:0}.doxa-prose{max-width:820px}.doxa-prose h1{font-size:clamp(36px,5vw,72px);line-height:.95;margin:0 0 28px;text-transform:uppercase;letter-spacing:.06em}.doxa-prose h2{font-size:30px;margin:48px 0 16px}.doxa-prose h3{font-size:22px;margin:32px 0 12px}.doxa-prose p,.doxa-prose li{color:#d7d7d7;line-height:1.75}.doxa-prose code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#151515;border:1px solid var(--line);padding:.12em .35em}.doxa-prose pre{overflow:auto;border:1px solid var(--line);background:#090909;padding:18px}.doxa-prose pre code{border:0;background:transparent;padding:0}.doxa-prose table{width:100%;border-collapse:collapse;margin:24px 0}.doxa-prose th,.doxa-prose td{border:1px solid var(--line);padding:10px;text-align:left}.doxa-prose th{background:#111}.doxa-prose blockquote{border-left:3px solid var(--accent);margin-left:0;padding-left:18px;color:#d7d7d7}
.doxa-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:24px 0}.doxa-card{border:1px solid var(--line);background:var(--panel);padding:16px}.doxa-card p{margin-bottom:0}.doxa-note{border:1px solid var(--line);background:#101010;padding:12px 14px;margin:20px 0}.doxa-note-warning{border-color:#6d4d19;background:#181105}.doxa-note-danger{border-color:#6d1f2b;background:#19080b}.doxa-note-success{border-color:#1f6d3a;background:#07160d}.doxa-note-info{border-color:#1e4f82;background:#07111f}.doxa-steps{margin:24px 0}.doxa-step{position:relative;border-left:1px solid var(--line);padding:0 0 24px 34px}.doxa-step-number{position:absolute;left:-14px;top:0;width:28px;height:28px;border:1px solid var(--line);background:#111;display:grid;place-items:center;border-radius:999px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
.doxa-eyebrow{color:var(--accent)!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.24em;font-size:12px}
@media(max-width:860px){.doxa-layout{grid-template-columns:1fr}.doxa-sidebar{position:static}.doxa-header{height:auto;gap:10px;align-items:flex-start;flex-direction:column;padding-top:18px;padding-bottom:18px}}
`;

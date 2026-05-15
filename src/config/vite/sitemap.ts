import { execFileSync } from "node:child_process";

import Documents from "../../contents/settings/documents.json";

interface DocumentRoute {
  title?: string;
  href?: string;
  noLink?: true;
  items?: DocumentRoute[];
}

interface SitemapPage {
  path: string;
  sitemap?: {
    lastmod?: string;
  };
}

const gitLastModifiedCache = new Map<string, string | undefined>();

function getGitLastModifiedDate(filePath: string): string | undefined {
  const cached = gitLastModifiedCache.get(filePath);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const lastModified = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--follow", "--", filePath],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }
    ).trim();

    const resolved = lastModified || undefined;
    gitLastModifiedCache.set(filePath, resolved);
    return resolved;
  } catch {
    gitLastModifiedCache.set(filePath, undefined);
    return undefined;
  }
}

function getDocsPages(routes: DocumentRoute[], parentHref = ""): SitemapPage[] {
  const pages: SitemapPage[] = [];

  for (const route of routes) {
    if (route.title && route.href) {
      const href = `${parentHref}${route.href}`;
      const filePath = `src/contents/docs${href}/index.mdx`;
      const lastModified = getGitLastModifiedDate(filePath);

      if (!route.noLink) {
        pages.push({
          path: href,
          sitemap: lastModified
            ? {
                lastmod: lastModified,
              }
            : undefined,
        });
      }

      if (route.items) {
        pages.push(...getDocsPages(route.items, href));
      }
    }
  }

  return pages;
}

export function getSitemapPages(): SitemapPage[] {
  return getDocsPages(Documents as DocumentRoute[]);
}

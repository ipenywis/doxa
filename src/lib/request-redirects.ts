import Documents from "@/src/contents/settings/documents.json";

type RedirectStatus = 301 | 302 | 303 | 307 | 308;

interface RedirectDocumentRoute {
  href?: string;
  noLink?: true;
  items?: RedirectDocumentRoute[];
}

function findFirstLinkedHref(
  routes: RedirectDocumentRoute[],
  parentHref = ""
): string | undefined {
  for (const route of routes) {
    const href = route.href ? `${parentHref}${route.href}` : undefined;
    if (href && !route.noLink) return href;

    if (route.items) {
      const childHref = findFirstLinkedHref(route.items, href ?? parentHref);
      if (childHref) return childHref;
    }
  }

  return undefined;
}

export const homePath = findFirstLinkedHref(Documents);

export function getRedirectPath(pathname: string): string | null {
  if (pathname === "/" && homePath) {
    return homePath;
  }

  if (pathname.startsWith("/docs/assets/")) {
    return pathname.replace(/^\/docs\/assets/, "/assets");
  }

  if (pathname === "/docs") return homePath ?? "/";
  if (pathname.startsWith("/docs/")) {
    return pathname.slice("/docs".length) || "/";
  }

  return null;
}

export function redirectToPath(
  url: string,
  pathname: string,
  status: RedirectStatus = 308
) {
  const redirectUrl = new URL(url);
  redirectUrl.pathname = pathname;

  return Response.redirect(redirectUrl.toString(), status);
}

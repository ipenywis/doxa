import Documents from "@/src/contents/settings/documents.json";

type RedirectStatus = 301 | 302 | 303 | 307 | 308;

interface RedirectDecision {
  redirectPath: string;
  status: RedirectStatus;
}

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

export function getRedirectDecision(pathname: string): RedirectDecision | null {
  const status: RedirectStatus = 308;

  if (pathname === "/" && homePath) {
    return { redirectPath: homePath, status };
  }

  if (pathname.startsWith("/docs/assets/")) {
    return {
      redirectPath: pathname.replace(/^\/docs\/assets/, "/assets"),
      status,
    };
  }

  if (pathname === "/docs") {
    return { redirectPath: homePath ?? "/", status };
  }

  if (pathname.startsWith("/docs/")) {
    return { redirectPath: pathname.slice("/docs".length) || "/", status };
  }

  return null;
}

export function getRedirectPath(pathname: string): string | null {
  return getRedirectDecision(pathname)?.redirectPath ?? null;
}

export function getRedirectResponse(request: Request): Response | null {
  const { pathname } = new URL(request.url);
  const decision = getRedirectDecision(pathname);

  if (!decision) return null;

  return redirectToPath(request.url, decision.redirectPath, decision.status);
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

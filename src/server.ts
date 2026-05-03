import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

import { tryRawMarkdownResponse } from "@/src/lib/raw-markdown";

const startHandler = createStartHandler(defaultStreamHandler);

function getNormalizedPath(pathname: string): string | null {
  if (pathname.startsWith("/docs/assets/")) {
    return pathname.replace(/^\/docs\/assets/, "/assets");
  }

  if (pathname === "/docs") return "/";
  if (pathname.startsWith("/docs/")) {
    return pathname.slice("/docs".length) || "/";
  }

  return null;
}

function redirectToPath(url: string, pathname: string) {
  const redirectUrl = new URL(url);
  redirectUrl.pathname = pathname;

  return Response.redirect(redirectUrl.toString(), 308);
}

const server = {
  async fetch(request: Request) {
    const { pathname } = new URL(request.url);

    const normalizedPath = getNormalizedPath(pathname);
    if (normalizedPath) {
      return redirectToPath(request.url, normalizedPath);
    }

    const rawMarkdown = await tryRawMarkdownResponse(pathname);
    if (rawMarkdown) return rawMarkdown;

    return startHandler(request);
  },
};

export default server;

import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

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
    const normalizedPath = getNormalizedPath(new URL(request.url).pathname);

    if (normalizedPath) {
      return redirectToPath(request.url, normalizedPath);
    }

    return startHandler(request);
  },
};

export default server;

import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

const startHandler = createStartHandler(defaultStreamHandler);

function getNormalizedDocsPath(pathname: string): string | null {
  if (pathname === "/docs/docs") {
    return "/docs";
  }

  if (pathname.startsWith("/docs/docs/")) {
    return pathname.replace(/^\/docs\/docs/, "/docs");
  }

  if (pathname.startsWith("/docs/assets/")) {
    return pathname.replace(/^\/docs\/assets/, "/assets");
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
    const normalizedPath = getNormalizedDocsPath(new URL(request.url).pathname);

    if (normalizedPath) {
      return redirectToPath(request.url, normalizedPath);
    }

    return startHandler(request);
  },
};

export default server;

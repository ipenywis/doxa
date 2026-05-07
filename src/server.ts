import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

import { tryRawMarkdownResponse } from "@/src/lib/raw-markdown";
import { getRedirectPath, redirectToPath } from "@/src/lib/request-redirects";

const startHandler = createStartHandler(defaultStreamHandler);

const server = {
  async fetch(request: Request) {
    const { pathname } = new URL(request.url);

    const redirectPath = getRedirectPath(pathname);
    if (redirectPath) {
      return redirectToPath(request.url, redirectPath);
    }

    const rawMarkdown = await tryRawMarkdownResponse(pathname);
    if (rawMarkdown) return rawMarkdown;

    return startHandler(request);
  },
};

export default server;

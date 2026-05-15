import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

import { tryRawMarkdownResponse } from "@/src/lib/raw-markdown";
import { getRedirectResponse } from "@/src/lib/request-redirects";

const startHandler = createStartHandler(defaultStreamHandler);

const server = {
  async fetch(request: Request) {
    const { pathname } = new URL(request.url);

    const redirect = getRedirectResponse(request);
    if (redirect) return redirect;

    const rawMarkdown = await tryRawMarkdownResponse(pathname);
    if (rawMarkdown) return rawMarkdown;

    return startHandler(request);
  },
};

export default server;

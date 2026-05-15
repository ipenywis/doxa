/* global URL */
import server from "virtual:tanstack-start-server-entry";

import { getRedirectResponse } from "./src/lib/request-redirects";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const redirect = getRedirectResponse(request);
    if (redirect) return redirect;

    // Skip the static-asset binding for `.md` requests so the per-page raw
    // markdown handler in `src/server.ts` runs. Without this, the dev server
    // (and Cloudflare's catch-all asset behavior) can return a 200 SPA shell
    // for `/foo.md` and shadow the markdown response.
    const isRawMarkdown = pathname.endsWith(".md");

    if (env.ASSETS && !isRawMarkdown) {
      const directResponse = await env.ASSETS.fetch(request.clone());
      if (directResponse.ok) return directResponse;
    }

    return server.fetch(request);
  },
};

import { createFileRoute } from "@tanstack/react-router";

import { resolveSiteUrl } from "@/src/lib/site-url";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const siteUrl = resolveSiteUrl(process.env);
        const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;

        return new Response(robots, {
          headers: {
            "Content-Type": "text/plain",
          },
        });
      },
    },
  },
});

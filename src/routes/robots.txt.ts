import { createFileRoute } from "@tanstack/react-router"

import { Settings } from "@/src/types/settings"

export const Route = createFileRoute("/robots/txt")({
  server: {
    handlers: {
      GET: async () => {
        const robots = `User-agent: *
Allow: /

Sitemap: ${Settings.metadataBase}/sitemap.xml`

        return new Response(robots, {
          headers: {
            "Content-Type": "text/plain",
          },
        })
      },
    },
  },
})

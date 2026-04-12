import { PageRoutes } from "@/src/lib/pageroutes"
import { createFileRoute } from "@tanstack/react-router"

import { Settings } from "@/src/settings/main"

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = Settings.site.url

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${PageRoutes.map(
    (route) => `
  <url>
    <loc>${baseUrl}/docs${route.href}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  ).join("")}
</urlset>`

        return new Response(sitemap, {
          headers: {
            "Content-Type": "application/xml",
          },
        })
      },
    },
  },
})

import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoSubfolderIndex: true,
        autoStaticPathsDiscovery: true,
        concurrency: 14,
        retryCount: 2,
        retryDelay: 1000,
        maxRedirects: 5,
        failOnError: true,
        onSuccess: ({ page }) => {
          console.log("Prerendered path:", page.path)
        }
      },
    }),
    viteReact(),
  ],
})

import type { DeploymentTarget } from "./deployment";
import { getSitemapPages } from "./sitemap";

export const prerenderConfig = {
  enabled: true,
  crawlLinks: true,
  autoSubfolderIndex: true,
  autoStaticPathsDiscovery: false,
  concurrency: 14,
  retryCount: 2,
  retryDelay: 1000,
  maxRedirects: 5,
  failOnError: true,
  onSuccess: ({ page }: { page: { path: string } }) => {
    console.log("Prerendered path:", page.path);
  },
};

export function createStartConfig(
  deploymentTarget: DeploymentTarget,
  sitemapHost: string
) {
  return {
    server: {
      entry: "./server.ts",
    },
    pages: getSitemapPages(),
    ...(deploymentTarget === "cloudflare" && shouldPrerenderCloudflareBuild()
      ? { prerender: prerenderConfig }
      : {}),
    sitemap: {
      enabled: true,
      host: sitemapHost,
    },
  };
}

function shouldPrerenderCloudflareBuild() {
  const wranglerConfigPath = process.env.CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH;
  if (wranglerConfigPath?.includes("renderer")) return false;

  return process.env.DOXA_DOCS_RUNTIME_SOURCE !== "platform";
}

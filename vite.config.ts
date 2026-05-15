import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

import {
  getDeploymentTarget,
  getHostingPlugins,
} from "./src/config/vite/deployment";
import { createMdxPlugin } from "./src/config/vite/mdx";
import { mdxSourceCapturePlugin } from "./src/config/vite/mdx-source-capture";
import { searchDataPlugin } from "./src/config/vite/search-data";
import { createStartConfig } from "./src/config/vite/start";
import { resolveSiteUrl } from "./src/lib/site-url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const deploymentTarget = getDeploymentTarget();
  const sitemapHost = resolveSiteUrl({
    ...process.env,
    ...env,
  });
  const buildConfig =
    deploymentTarget === "cloudflare"
      ? {
          rollupOptions: {
            output: {
              manualChunks: {
                mermaid: ["mermaid"],
                react: ["react", "react-dom"],
              },
            },
          },
        }
      : undefined;

  const startConfig = createStartConfig(deploymentTarget, sitemapHost);

  return {
    base: "/",
    server: {
      port: 3000,
    },
    build: buildConfig,
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      createMdxPlugin(),
      mdxSourceCapturePlugin(),
      searchDataPlugin(),
      tailwindcss(),
      tanstackStart(startConfig),
      viteReact(),
      ...getHostingPlugins(deploymentTarget),
    ],
  };
});

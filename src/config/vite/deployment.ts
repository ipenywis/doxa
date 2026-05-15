import { cloudflare } from "@cloudflare/vite-plugin";
import { nitro } from "nitro/vite";
import type { PluginOption } from "vite";

export type DeploymentTarget = "cloudflare" | "vercel" | "docker";

export function getDeploymentTarget(): DeploymentTarget {
  switch (process.env.DOXA_DEPLOY_TARGET) {
    case "docker":
      return "docker";
    case "vercel":
      return "vercel";
    default:
      return "cloudflare";
  }
}

export function getHostingPlugins(target: DeploymentTarget): PluginOption[] {
  if (target === "vercel") {
    return [nitro({ preset: "vercel" })];
  }

  if (target === "docker") {
    return [nitro({ preset: "node-server" })];
  }

  return [cloudflare({ viteEnvironment: { name: "ssr" } })];
}

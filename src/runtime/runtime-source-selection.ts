import { getRequestHost } from "@tanstack/react-start/server";

import type { PlatformRuntimeSourceConfig } from "./platform-runtime-source";
import type { DoxaDocsRuntimeSource } from "./runtime-source";

export type RuntimeSourceMode = "vite" | "platform";

type RuntimeSourceEnv = Record<string, string | undefined>;

export async function createConfiguredRuntimeSource(
  env: RuntimeSourceEnv = process.env
): Promise<DoxaDocsRuntimeSource> {
  const mode = getRuntimeSourceMode(env);

  switch (mode) {
    case "vite": {
      const { viteRuntimeSource } = await import("./vite");
      return viteRuntimeSource;
    }
    case "platform": {
      const { createPlatformRuntimeSource } = await import("./platform");
      return createPlatformRuntimeSource(getPlatformRuntimeSourceConfig(env));
    }
  }
}

export function getRuntimeSourceMode(
  env: RuntimeSourceEnv = process.env
): RuntimeSourceMode {
  const source =
    env.DOXA_DOCS_RUNTIME_SOURCE ??
    env.DOXA_RUNTIME_SOURCE ??
    env.RUNTIME_SOURCE ??
    "vite";

  if (source === "vite" || source === "platform") return source;

  throw new Error(
    `Unknown DOXA_DOCS_RUNTIME_SOURCE: "${source}". Expected "vite" or "platform".`
  );
}

export function getPlatformRuntimeSourceConfig(
  env: RuntimeSourceEnv = process.env
): PlatformRuntimeSourceConfig {
  const hostname =
    readRuntimeEnv(env, [
      "DOXA_DOCS_CONTENT_HOSTNAME",
      "DOXA_PLATFORM_HOSTNAME",
    ]) ?? readRequestHostname();
  const projectId = readRuntimeEnv(env, [
    "DOXA_DOCS_CONTENT_PROJECT_ID",
    "DOXA_PLATFORM_PROJECT_ID",
  ]);

  return {
    contentWorkerUrl: requireRuntimeEnv(env, [
      "DOXA_DOCS_CONTENT_WORKER_URL",
      "DOXA_PLATFORM_CONTENT_URL",
    ]),
    accessToken: requireRuntimeEnv(env, [
      "DOXA_DOCS_CONTENT_TOKEN",
      "DOXA_PLATFORM_CONTENT_TOKEN",
    ]),
    ...(hostname ? { hostname } : {}),
    ...(projectId ? { projectId } : {}),
    runtimePath:
      env.DOXA_DOCS_CONTENT_RUNTIME_PATH ??
      env.DOXA_PLATFORM_CONTENT_RUNTIME_PATH,
  };
}

function readRuntimeEnv(
  env: RuntimeSourceEnv,
  names: readonly string[]
): string | undefined {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }

  return undefined;
}

function requireRuntimeEnv(env: RuntimeSourceEnv, names: string[]): string {
  const value = readRuntimeEnv(env, names);
  if (value) return value;

  throw new Error(
    `Missing required platform runtime env var. Set one of: ${names.join(", ")}.`
  );
}

function readRequestHostname(): string | undefined {
  try {
    const hostname = getRequestHost({ xForwardedHost: false }).trim();
    return hostname || undefined;
  } catch {
    return undefined;
  }
}

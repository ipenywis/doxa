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
  return {
    contentWorkerUrl: requireRuntimeEnv(env, [
      "DOXA_DOCS_CONTENT_WORKER_URL",
      "DOXA_PLATFORM_CONTENT_URL",
    ]),
    projectId: requireRuntimeEnv(env, [
      "DOXA_DOCS_CONTENT_PROJECT_ID",
      "DOXA_PLATFORM_PROJECT_ID",
    ]),
    accessToken: requireRuntimeEnv(env, [
      "DOXA_DOCS_CONTENT_TOKEN",
      "DOXA_PLATFORM_CONTENT_TOKEN",
    ]),
    runtimePath:
      env.DOXA_DOCS_CONTENT_RUNTIME_PATH ??
      env.DOXA_PLATFORM_CONTENT_RUNTIME_PATH,
  };
}

function requireRuntimeEnv(env: RuntimeSourceEnv, names: string[]): string {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }

  throw new Error(
    `Missing required platform runtime env var. Set one of: ${names.join(", ")}.`
  );
}

import { describe, expect, test } from "vitest";

import {
  getPlatformRuntimeSourceConfig,
  getRuntimeSourceMode,
} from "./runtime-source-selection";

describe("runtime source selection", () => {
  test("defaults to vite mode", () => {
    expect(getRuntimeSourceMode({})).toBe("vite");
  });

  test("accepts explicit platform mode", () => {
    expect(getRuntimeSourceMode({ DOXA_DOCS_RUNTIME_SOURCE: "platform" })).toBe(
      "platform"
    );
  });

  test("rejects unknown runtime source modes", () => {
    expect(() =>
      getRuntimeSourceMode({ DOXA_DOCS_RUNTIME_SOURCE: "github" })
    ).toThrow('Unknown DOXA_DOCS_RUNTIME_SOURCE: "github"');
  });

  test("reads platform config from canonical env vars", () => {
    expect(
      getPlatformRuntimeSourceConfig({
        DOXA_DOCS_CONTENT_WORKER_URL: "https://content.example.com",
        DOXA_DOCS_CONTENT_PROJECT_ID: "project_123",
        DOXA_DOCS_CONTENT_TOKEN: "secret-token",
        DOXA_DOCS_CONTENT_RUNTIME_PATH: "/v1/runtime",
      })
    ).toEqual({
      contentWorkerUrl: "https://content.example.com",
      projectId: "project_123",
      accessToken: "secret-token",
      runtimePath: "/v1/runtime",
    });
  });

  test("reads platform host-scoped config from canonical env vars", () => {
    expect(
      getPlatformRuntimeSourceConfig({
        DOXA_DOCS_CONTENT_WORKER_URL: "https://content.example.com",
        DOXA_DOCS_CONTENT_HOSTNAME: "docs.example.com",
        DOXA_DOCS_CONTENT_TOKEN: "secret-token",
      })
    ).toMatchObject({
      contentWorkerUrl: "https://content.example.com",
      hostname: "docs.example.com",
      accessToken: "secret-token",
    });
  });

  test("supports platform env aliases", () => {
    expect(
      getPlatformRuntimeSourceConfig({
        DOXA_PLATFORM_CONTENT_URL: "https://content.example.com",
        DOXA_PLATFORM_HOSTNAME: "docs.example.com",
        DOXA_PLATFORM_CONTENT_TOKEN: "secret-token",
      })
    ).toMatchObject({
      contentWorkerUrl: "https://content.example.com",
      hostname: "docs.example.com",
      accessToken: "secret-token",
    });
  });

  test("supports legacy platform project id aliases", () => {
    expect(
      getPlatformRuntimeSourceConfig({
        DOXA_PLATFORM_CONTENT_URL: "https://content.example.com",
        DOXA_PLATFORM_PROJECT_ID: "project_123",
        DOXA_PLATFORM_CONTENT_TOKEN: "secret-token",
      })
    ).toMatchObject({
      contentWorkerUrl: "https://content.example.com",
      projectId: "project_123",
      accessToken: "secret-token",
    });
  });

  test("requires platform content worker configuration", () => {
    expect(() => getPlatformRuntimeSourceConfig({})).toThrow(
      "Missing required platform runtime env var"
    );
  });
});

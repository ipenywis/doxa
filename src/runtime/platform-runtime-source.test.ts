import { describe, expect, test, vi } from "vitest";

import { createPlatformRuntimeSource } from "./platform-runtime-source";

describe("platform runtime source", () => {
  test("sends authenticated project-scoped runtime operations", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://content.example.com/runtime-source");
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({
        authorization: "Bearer secret-token",
        "content-type": "application/json",
        "x-doxa-project-id": "project_123",
        "x-doxa-runtime-source-version": "1",
      });
      expect(JSON.parse(String(init?.body))).toEqual({
        operation: "resolvePage",
        payload: { pathname: "/overview" },
      });

      return jsonResponse({
        ok: true,
        data: {
          type: "not_found",
          href: "/overview",
          slug: "overview",
        },
      });
    });
    const source = createPlatformRuntimeSource({
      contentWorkerUrl: "https://content.example.com/",
      projectId: "project_123",
      accessToken: "secret-token",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(source.resolvePage("overview")).resolves.toEqual({
      type: "not_found",
      href: "/overview",
      slug: "overview",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("sends authenticated host-scoped runtime operations", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        authorization: "Bearer secret-token",
        "content-type": "application/json",
        "x-doxa-host": "docs.example.com",
        "x-doxa-runtime-source-version": "1",
      });
      expect(init?.headers).not.toMatchObject({
        "x-doxa-project-id": "project_123",
      });

      return jsonResponse({
        ok: true,
        data: "/overview",
      });
    });
    const source = createPlatformRuntimeSource({
      contentWorkerUrl: "https://content.example.com",
      hostname: "docs.example.com",
      projectId: "project_123",
      accessToken: "secret-token",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(source.getHomeHref()).resolves.toBe("/overview");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("uses the configured runtime path and memoizes matching requests", async () => {
    let requestedUrl: string | undefined;
    const fetchMock = vi.fn(async (url: string) => {
      requestedUrl = url;
      return jsonResponse({
        ok: true,
        data: "/overview",
      });
    });
    const source = createPlatformRuntimeSource({
      contentWorkerUrl: "https://content.example.com/api",
      projectId: "project_123",
      accessToken: "secret-token",
      runtimePath: "v1/runtime",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(source.getHomeHref()).resolves.toBe("/overview");
    await expect(source.getHomeHref()).resolves.toBe("/overview");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedUrl).toBe("https://content.example.com/api/v1/runtime");
  });

  test("throws clear errors for platform API failures", async () => {
    const source = createPlatformRuntimeSource({
      contentWorkerUrl: "https://content.example.com",
      projectId: "project_123",
      accessToken: "secret-token",
      fetch: vi.fn(async () =>
        jsonResponse({
          ok: false,
          error: { code: "project_not_found", message: "Unknown project" },
        })
      ) as unknown as typeof fetch,
    });

    await expect(source.getSections()).rejects.toThrow(
      "[platform-runtime-source] getSections: Unknown project"
    );
  });

  test("requires endpoint, runtime scope, and token configuration", () => {
    expect(() =>
      createPlatformRuntimeSource({
        contentWorkerUrl: "",
        projectId: "project_123",
        accessToken: "secret-token",
      })
    ).toThrow("Missing contentWorkerUrl");
    expect(() =>
      createPlatformRuntimeSource({
        contentWorkerUrl: "https://content.example.com",
        projectId: "",
        accessToken: "secret-token",
      })
    ).toThrow("Missing hostname or projectId");
    expect(() =>
      createPlatformRuntimeSource({
        contentWorkerUrl: "https://content.example.com",
        projectId: "project_123",
        accessToken: "",
      })
    ).toThrow("Missing accessToken");
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

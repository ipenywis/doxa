import { afterEach, describe, expect, test, vi } from "vitest";

import type { ContentAdapter } from "../lib/content/types";
import * as runtimeModule from "./index";
import { createDoxaDocsRuntime, renderRuntimeMdx } from "./index";

describe("portable runtime entrypoint", () => {
  test("does not expose Vite-only runtime source bindings", () => {
    expect(runtimeModule).not.toHaveProperty("createViteRuntimeSource");
    expect(runtimeModule).not.toHaveProperty("viteRuntimeSource");
  });
});

describe("renderRuntimeMdx", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders frontmatter, gfm, code, links, and template components", async () => {
    const rendered = await renderRuntimeMdx(`---
title: Runtime Page
description: Runtime description
---

# Runtime Page

<Note type="warning" title="Heads up">
Watch this.
</Note>

| Name | Value |
| --- | --- |
| Doxa | Docs |

\`\`\`ts
const value = "ok";
\`\`\`
`);

    expect(rendered.frontmatter.title).toBe("Runtime Page");
    expect(rendered.frontmatter.description).toBe("Runtime description");
    expect(rendered.html).toContain("<h1>Runtime Page</h1>");
    expect(rendered.html).toContain("doxa-note-warning");
    expect(rendered.html).toContain("<table>");
    expect(rendered.html).toContain("const value");
  });

  test("fails with useful error for unknown components", async () => {
    await expect(renderRuntimeMdx("<UnknownComponent />")).rejects.toThrow(
      "Failed to render MDX content:"
    );
  });

  test("does not require string code generation", async () => {
    vi.stubGlobal("Function", () => {
      throw new Error("codegen blocked");
    });

    const rendered = await renderRuntimeMdx("# Runtime Safe\n\nNo eval.");

    expect(rendered.html).toContain("<h1>Runtime Safe</h1>");
  });
});

describe("createDoxaDocsRuntime", () => {
  test("renders a docs page from a content adapter", async () => {
    const runtime = createDoxaDocsRuntime({
      contentAdapter: createMemoryAdapter({
        "settings/documents.json": JSON.stringify([
          { title: "Intro", href: "/" },
        ]),
        "index.mdx": "---\ntitle: Intro\n---\n\n# Intro\n\nHello.",
      }),
      siteConfig: {
        name: "Doxa Demo",
        description: "Generated docs",
        url: "https://preview.doxa.so/demo",
      },
    });

    const result = await runtime.render({ docsPath: "/", basePath: "/demo" });

    expect(result.status).toBe(200);
    expect(result.html).toContain("<h1>Intro</h1>");
    expect(result.html).toContain("Doxa Docs");
    expect(result.html).toContain('href="/demo"');
  });

  test("returns template 404 when content is missing", async () => {
    const runtime = createDoxaDocsRuntime({
      contentAdapter: createMemoryAdapter({}),
      siteConfig: {
        name: "Missing",
        url: "https://preview.doxa.so/missing",
      },
    });

    const result = await runtime.render({
      docsPath: "/missing",
      basePath: "/demo",
    });

    expect(result.status).toBe(404);
    expect(result.html).toContain("Page not found");
  });
});

function createMemoryAdapter(files: Record<string, string>): ContentAdapter {
  return {
    name: "memory",
    async listFiles() {
      return Object.keys(files);
    },
    async readFile(filePath) {
      return files[filePath] ?? null;
    },
  };
}

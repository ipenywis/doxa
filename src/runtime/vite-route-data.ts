import { createServerFn } from "@tanstack/react-start";

import {
  getDocsRouteRawDocument,
  resolveDocsRootRouteData,
  resolveDocsRouteData,
} from "./docs-route-data";

interface DocsRouteInput {
  pathname: string;
}

export const loadViteDocsRouteData = createServerFn({ method: "GET" })
  .inputValidator((input: DocsRouteInput) => input)
  .handler(async ({ data }) => {
    const { viteRuntimeSource } = await import("./vite");

    return resolveDocsRouteData(viteRuntimeSource, data.pathname, {
      includeRawDocument: false,
    });
  });

export const loadViteDocsRawPage = createServerFn({ method: "GET" })
  .inputValidator((slugOrHref: string) => slugOrHref)
  .handler(async ({ data }) => {
    const { viteRuntimeSource } = await import("./vite");

    return getDocsRouteRawDocument(viteRuntimeSource, data);
  });

export const loadViteDocsRootRouteData = createServerFn({
  method: "GET",
}).handler(async () => {
  const { viteRuntimeSource } = await import("./vite");

  return resolveDocsRootRouteData(viteRuntimeSource);
});

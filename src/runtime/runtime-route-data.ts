import { createServerFn } from "@tanstack/react-start";

import {
  getDocsRouteRawDocument,
  resolveDocsRootRouteData,
  resolveDocsRouteData,
} from "./docs-route-data";
import { createConfiguredRuntimeSource } from "./runtime-source-selection";

interface DocsRouteInput {
  pathname: string;
}

export const loadDocsRouteData = createServerFn({ method: "GET" })
  .inputValidator((input: DocsRouteInput) => input)
  .handler(async ({ data }) => {
    const source = await createConfiguredRuntimeSource();

    return resolveDocsRouteData(source, data.pathname, {
      includeRawDocument: false,
    });
  });

export const loadDocsRawPage = createServerFn({ method: "GET" })
  .inputValidator((slugOrHref: string) => slugOrHref)
  .handler(async ({ data }) => {
    const source = await createConfiguredRuntimeSource();

    return getDocsRouteRawDocument(source, data);
  });

export const loadDocsRootRouteData = createServerFn({
  method: "GET",
}).handler(async () => {
  const source = await createConfiguredRuntimeSource();

  return resolveDocsRootRouteData(source);
});

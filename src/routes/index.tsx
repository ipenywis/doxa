import { getDemoRedirectSearch } from "@/src/runtime/demo-search";
import { loadDocsRootRouteData } from "@/src/runtime/runtime-route-data";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: async ({ location }) => {
    const data = await loadDocsRootRouteData();

    if (data.type === "redirect") {
      throw redirect({
        to: data.href,
        ...getDemoRedirectSearch(location.search),
      });
    }

    return null;
  },
  component: () => null,
});

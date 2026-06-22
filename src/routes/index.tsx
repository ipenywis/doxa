import { getDemoRedirectSearch } from "@/src/runtime/demo-search";
import { loadViteDocsRootRouteData } from "@/src/runtime/vite-route-data";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: async ({ location }) => {
    const data = await loadViteDocsRootRouteData();

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

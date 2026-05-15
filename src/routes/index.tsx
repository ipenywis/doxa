import { createFileRoute, redirect } from "@tanstack/react-router";

import { homePath } from "@/src/lib/request-redirects";

export const Route = createFileRoute("/")({
  loader: ({ location }) => {
    const search = location.search as Record<string, unknown>;
    const demo =
      search.demo === true ||
      search.demo === "true" ||
      search.demo === "" ||
      search.demo === 1 ||
      search.demo === "1";

    if (homePath) {
      throw redirect({
        to: homePath,
        ...(demo ? { search: { demo: true as const } } : {}),
      });
    }

    return null;
  },
  component: () => null,
});

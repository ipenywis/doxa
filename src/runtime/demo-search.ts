export function getDemoRedirectSearch(
  search: Record<string, unknown>
): { search: { demo: true } } | Record<string, never> {
  return isDemoSearch(search) ? { search: { demo: true } } : {};
}

function isDemoSearch(search: Record<string, unknown>): boolean {
  return (
    search.demo === true ||
    search.demo === "true" ||
    search.demo === "" ||
    search.demo === 1 ||
    search.demo === "1"
  );
}

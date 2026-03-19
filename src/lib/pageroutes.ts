import { Documents } from "@/src/contents/settings/documents"

export type Paths =
  | {
      title: string
      href: string
      noLink?: true
      heading?: string
      /**
       * Nesting is temporarily disabled in the sidebar.
       * Items are kept in the type for backward compatibility.
       */
      items?: Paths[]
    }
  | {
      heading: string
    }
  | {
      spacer: true
    }

function flattenRoutes(routes: Paths[]): Paths[] {
  const result: Paths[] = []
  for (const route of routes) {
    result.push(route)
    if ("items" in route && route.items) {
      result.push(...flattenRoutes(route.items))
    }
  }
  return result
}

export const Routes: Paths[] = flattenRoutes(Documents)

export function isRoute(
  node: Paths
): node is Extract<Paths, { title: string; href: string }> {
  return "title" in node && "href" in node
}

export function isHeading(
  node: Paths
): node is Extract<Paths, { heading: string }> {
  return "heading" in node && !("title" in node)
}

interface Page {
  title: string
  href: string
}

export const PageRoutes: Page[] = Routes.filter(isRoute)
  .filter((node) => !node.noLink)
  .map((node) => ({ title: node.title, href: node.href }))

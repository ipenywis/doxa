import type { Paths } from "@/src/lib/pageroutes";

interface BreadcrumbInfo {
  trail: string[];
  icon?: string;
}

function isRoute(
  node: Paths
): node is Extract<Paths, { href: string; title: string }> {
  return "href" in node && "title" in node;
}

function isHeadingNode(
  node: Paths
): node is Extract<Paths, { heading: string }> {
  return "heading" in node && !("title" in node);
}

interface RouteWithIcon {
  title: string;
  href: string;
  icon?: string;
  noLink?: true;
  items?: Paths[];
}

function walk(
  nodes: Paths[],
  parentTrail: string[],
  prefix: string,
  out: Map<string, BreadcrumbInfo>
) {
  let currentHeading: string | null = null;
  for (const node of nodes) {
    if (isHeadingNode(node)) {
      currentHeading = node.heading;
      continue;
    }
    if (!isRoute(node)) continue;

    const trail = currentHeading
      ? [...parentTrail, currentHeading]
      : [...parentTrail];

    const fullHref = `${prefix}${node.href}`;
    const typedNode = node as RouteWithIcon;
    out.set(fullHref, { trail, icon: typedNode.icon });

    if (typedNode.items && typedNode.items.length > 0) {
      walk(typedNode.items, [...trail, node.title], fullHref, out);
    }
  }
}

export function buildBreadcrumbMap(
  nodes: Paths[]
): Map<string, BreadcrumbInfo> {
  const map = new Map<string, BreadcrumbInfo>();
  walk(nodes, [], "", map);
  return map;
}

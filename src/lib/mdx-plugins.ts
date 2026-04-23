import type { Element, Text } from "hast";
import type { Root } from "mdast";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

const frontmatterNodeTypes: ReadonlySet<string> = new Set(["yaml", "toml"]);

export function remarkStripFrontmatter() {
  return (tree: Root) => {
    tree.children = tree.children.filter(
      (node) => !frontmatterNodeTypes.has(node.type)
    );
  };
}

export function rehypePreCopy() {
  return (tree: Node) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") {
        return;
      }

      const [codeElement] = node.children as Element[];
      if (codeElement?.tagName !== "code") {
        return;
      }

      const textNode = codeElement.children?.[0] as Text | undefined;
      node.properties = node.properties ?? {};
      node.properties.raw = textNode?.value ?? "";
    });
  };
}

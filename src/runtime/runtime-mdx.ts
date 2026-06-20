import React, { type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { runtimeComponents, type RuntimeMdxComponents } from "./mdx-components";

export interface RuntimeMdxRenderOptions {
  components?: Partial<RuntimeMdxComponents>;
}

export interface RuntimeMdxRenderResult {
  html: string;
  frontmatter: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

interface MdastNode {
  type: string;
  value?: string;
  depth?: number;
  ordered?: boolean;
  url?: string;
  alt?: string;
  lang?: string;
  name?: string | null;
  attributes?: MdxAttribute[];
  children?: MdastNode[];
}

type MdxAttribute =
  | {
      type: "mdxJsxAttribute";
      name: string;
      value?: string | number | boolean | null | MdxAttributeExpression;
    }
  | { type: string; name?: string; value?: unknown };

interface MdxAttributeExpression {
  type: string;
  value?: string;
}

export async function renderRuntimeMdx(
  source: string,
  options: RuntimeMdxRenderOptions = {}
): Promise<RuntimeMdxRenderResult> {
  const parsed = readFrontmatter(source);
  const components = {
    ...runtimeComponents,
    ...options.components,
  };

  try {
    const tree = unified()
      .use(remarkParse)
      .use(remarkMdx)
      .use(remarkGfm)
      .parse(parsed.content) as MdastNode;

    const content = renderChildren(tree.children ?? [], components);
    const html = renderToString(
      React.createElement(React.Fragment, null, ...content)
    );

    return {
      html,
      frontmatter: parsed.frontmatter,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to render MDX content: ${message}`);
  }
}

function renderNode(
  node: MdastNode,
  components: Partial<RuntimeMdxComponents>,
  key: string
): ReactNode {
  switch (node.type) {
    case "root":
      return React.createElement(
        React.Fragment,
        { key },
        ...renderChildren(node.children ?? [], components)
      );
    case "paragraph":
      return React.createElement(
        "p",
        { key },
        ...renderChildren(node.children ?? [], components)
      );
    case "heading":
      return React.createElement(
        `h${Math.min(Math.max(node.depth ?? 2, 1), 6)}`,
        { key },
        ...renderChildren(node.children ?? [], components)
      );
    case "text":
      return node.value ?? "";
    case "emphasis":
      return React.createElement(
        "em",
        { key },
        ...renderChildren(node.children ?? [], components)
      );
    case "strong":
      return React.createElement(
        "strong",
        { key },
        ...renderChildren(node.children ?? [], components)
      );
    case "inlineCode":
      return React.createElement("code", { key }, node.value ?? "");
    case "break":
      return React.createElement("br", { key });
    case "link":
      return React.createElement(
        components.a as React.ElementType,
        { key, href: sanitizeHref(node.url ?? "#") },
        ...renderChildren(node.children ?? [], components)
      );
    case "list":
      return React.createElement(
        node.ordered ? "ol" : "ul",
        { key },
        ...renderChildren(node.children ?? [], components)
      );
    case "listItem":
      return React.createElement(
        "li",
        { key },
        ...renderChildren(node.children ?? [], components)
      );
    case "blockquote":
      return React.createElement(
        "blockquote",
        { key },
        ...renderChildren(node.children ?? [], components)
      );
    case "code":
      return React.createElement(
        "pre",
        { key },
        React.createElement(
          "code",
          node.lang ? { className: `language-${node.lang}` } : {},
          node.value ?? ""
        )
      );
    case "thematicBreak":
      return React.createElement("hr", { key });
    case "table":
      return renderTable(node, components, key);
    case "mdxJsxFlowElement":
    case "mdxJsxTextElement":
      return renderMdxJsxElement(node, components, key);
    case "mdxTextExpression":
    case "mdxFlowExpression":
    case "mdxjsEsm":
      throw new Error(`Unsupported MDX syntax: ${node.type}`);
    case "html":
      return React.createElement("span", { key }, node.value ?? "");
    default:
      return renderChildren(node.children ?? [], components).length > 0
        ? React.createElement(
            React.Fragment,
            { key },
            ...renderChildren(node.children ?? [], components)
          )
        : null;
  }
}

function renderChildren(
  children: MdastNode[],
  components: Partial<RuntimeMdxComponents>
): ReactNode[] {
  return children
    .map((child, index) =>
      renderNode(child, components, `${child.type}-${index}`)
    )
    .filter(
      (child): child is ReactNode => child !== null && child !== undefined
    );
}

function renderTable(
  node: MdastNode,
  components: Partial<RuntimeMdxComponents>,
  key: string
): ReactNode {
  const rows = node.children ?? [];
  const [headRow, ...bodyRows] = rows;

  return React.createElement(
    "table",
    { key },
    headRow
      ? React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            ...renderTableCells(headRow, components, "th")
          )
        )
      : null,
    React.createElement(
      "tbody",
      null,
      ...bodyRows.map((row, index) =>
        React.createElement(
          "tr",
          { key: `row-${index}` },
          ...renderTableCells(row, components, "td")
        )
      )
    )
  );
}

function renderTableCells(
  row: MdastNode,
  components: Partial<RuntimeMdxComponents>,
  tag: "td" | "th"
): ReactNode[] {
  return (row.children ?? []).map((cell, index) =>
    React.createElement(
      tag,
      { key: `${tag}-${index}` },
      ...renderChildren(cell.children ?? [], components)
    )
  );
}

function renderMdxJsxElement(
  node: MdastNode,
  components: Partial<RuntimeMdxComponents>,
  key: string
): ReactNode {
  const name = node.name ?? "";
  const Component = components[name] as React.ElementType | undefined;
  if (!Component) {
    throw new Error(`Unknown MDX component: ${name}`);
  }

  return React.createElement(
    Component,
    { key, ...readMdxAttributes(node.attributes ?? []) },
    ...renderChildren(node.children ?? [], components)
  );
}

function readMdxAttributes(
  attributes: MdxAttribute[]
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const attribute of attributes) {
    if (attribute.type !== "mdxJsxAttribute" || !attribute.name) continue;
    props[attribute.name] = readMdxAttributeValue(attribute.value);
  }
  return props;
}

function readMdxAttributeValue(value: MdxAttribute["value"]): unknown {
  if (value === undefined || value === null) return true;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (!hasStringValue(value)) return undefined;

  const expression = value.value.trim();
  if (expression === "true") return true;
  if (expression === "false") return false;
  if (/^\d+(?:\.\d+)?$/.test(expression)) return Number(expression);

  const quoted = /^["'](.*)["']$/.exec(expression);
  return quoted ? quoted[1] : expression;
}

function hasStringValue(value: unknown): value is { value: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as { value?: unknown }).value === "string"
  );
}

function sanitizeHref(value: string): string {
  if (/^(https?:|mailto:|#|\/)/i.test(value)) return value;
  return "#";
}

function readFrontmatter(source: string): {
  content: string;
  frontmatter: RuntimeMdxRenderResult["frontmatter"];
} {
  if (!source.startsWith("---\n") && !source.startsWith("---\r\n")) {
    return { content: source, frontmatter: {} };
  }

  const newline = source.startsWith("---\r\n") ? "\r\n" : "\n";
  const closingMarker = `${newline}---${newline}`;
  const closingIndex = source.indexOf(closingMarker, 3);
  if (closingIndex === -1) {
    return { content: source, frontmatter: {} };
  }

  const rawFrontmatter = source.slice(3 + newline.length, closingIndex);
  const content = source.slice(closingIndex + closingMarker.length);
  return {
    content,
    frontmatter: parseFrontmatterYaml(rawFrontmatter),
  };
}

function parseFrontmatterYaml(
  yaml: string
): RuntimeMdxRenderResult["frontmatter"] {
  const data: RuntimeMdxRenderResult["frontmatter"] = {};
  const lines = yaml.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim();
    if (!line || line.startsWith("#")) continue;

    const match = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (key === "title") {
      data.title = readYamlString(rawValue);
      continue;
    }

    if (key === "description") {
      data.description = readYamlString(rawValue);
      continue;
    }

    if (key === "keywords") {
      data.keywords = readYamlStringList(rawValue, lines, index);
      if (!rawValue.trim()) {
        index = skipYamlList(lines, index);
      }
    }
  }

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords?.length ? data.keywords : undefined,
  };
}

function readYamlString(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const quoted = /^["'](.*)["']$/.exec(trimmed);
  return quoted ? quoted[1] : trimmed;
}

function readYamlStringList(
  value: string,
  lines: string[],
  keyIndex: number
): string[] | undefined {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => readYamlString(item))
      .filter((item): item is string => Boolean(item));
  }

  if (trimmed) {
    const item = readYamlString(trimmed);
    return item ? [item] : undefined;
  }

  const items: string[] = [];
  for (let index = keyIndex + 1; index < lines.length; index += 1) {
    const match = /^\s*-\s+(.+)$/.exec(lines[index] ?? "");
    if (!match) break;
    const item = readYamlString(match[1]);
    if (item) items.push(item);
  }
  return items;
}

function skipYamlList(lines: string[], keyIndex: number): number {
  let index = keyIndex;
  while (index + 1 < lines.length && /^\s*-\s+/.test(lines[index + 1] ?? "")) {
    index += 1;
  }
  return index;
}

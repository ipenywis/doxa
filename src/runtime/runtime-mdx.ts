import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import grayMatter from "gray-matter";
import { renderToString } from "react-dom/server";
import remarkGfm from "remark-gfm";

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

export async function renderRuntimeMdx(
  source: string,
  options: RuntimeMdxRenderOptions = {}
): Promise<RuntimeMdxRenderResult> {
  const parsed = grayMatter(source);
  const components = {
    ...runtimeComponents,
    ...options.components,
  };

  try {
    const mod = await evaluate(parsed.content, {
      ...jsxRuntime,
      baseUrl: import.meta.url,
      remarkPlugins: [remarkGfm],
    });
    const MdxContent = mod.default;
    const html = renderToString(
      React.createElement(MdxContent, { components })
    );

    return {
      html,
      frontmatter: parseFrontmatter(parsed.data),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to render MDX content: ${message}`);
  }
}

function parseFrontmatter(
  data: Record<string, unknown>
): RuntimeMdxRenderResult["frontmatter"] {
  return {
    title: typeof data.title === "string" ? data.title : undefined,
    description:
      typeof data.description === "string" ? data.description : undefined,
    keywords: Array.isArray(data.keywords)
      ? data.keywords.filter(
          (value): value is string => typeof value === "string"
        )
      : undefined,
  };
}

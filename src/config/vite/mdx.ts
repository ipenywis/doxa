import mdx from "@mdx-js/rollup";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeCodeTitles from "rehype-code-titles";
import rehypeKatex from "rehype-katex";
import rehypePrism from "rehype-prism-plus";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";

import { rehypePreCopy, remarkStripFrontmatter } from "../../lib/mdx-plugins";

export function createMdxPlugin() {
  return mdx({
    remarkPlugins: [remarkFrontmatter, remarkStripFrontmatter, remarkGfm],
    rehypePlugins: [
      rehypePreCopy,
      rehypeCodeTitles,
      rehypeKatex,
      [rehypePrism, { ignoreMissing: true }],
      rehypeSlug,
      rehypeAutolinkHeadings,
    ],
  });
}

import { readFile } from "node:fs/promises";

import type { PluginOption } from "vite";

const DOCS_SOURCE_ROOT = "/src/contents/docs/";

/**
 * Runs after @mdx-js/rollup and appends the original MDX text as a named
 * export. Server-only content readers use it for search, llms.txt, and chat.
 */
export function mdxSourceCapturePlugin(): PluginOption {
  return {
    name: "doxa:mdx-source-capture",
    enforce: "post",
    async transform(code, id) {
      const [filePath] = id.split("?");
      if (!filePath.endsWith(".mdx")) return null;
      if (!filePath.includes(DOCS_SOURCE_ROOT)) return null;

      const source = await readFile(filePath, "utf-8");
      return {
        code: `${code}\nexport const __rawSource = ${JSON.stringify(source)};\n`,
        map: null,
      };
    },
  };
}

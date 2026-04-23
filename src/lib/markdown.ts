import { createServerFn } from "@tanstack/react-start";

import { contentStore } from "@/src/lib/content/store";
import { PageRoutes } from "@/src/lib/pageroutes";

import documentsData from "../../public/search-data/documents.json";

export interface BaseMdxFrontmatter {
  title: string;
  description: string;
  keywords: string;
}

interface IndexedDocument {
  slug: string;
  title: string;
  description: string;
  _searchMeta: {
    headings: string[];
    keywords: string[];
  };
}

const indexedDocuments = new Map(
  (documentsData as IndexedDocument[]).map((document) => [
    document.slug.replace(/^\//, ""),
    document,
  ])
);

function getIndexedDocument(slug: string) {
  return indexedDocuments.get(slug) ?? null;
}

export async function getDocument(slug: string) {
  try {
    const document = getIndexedDocument(slug);
    if (!document) return null;

    return {
      frontmatter: {
        title: document.title,
        description: document.description,
        keywords: document._searchMeta.keywords.join(", "),
      } satisfies BaseMdxFrontmatter,
      code: "",
      tocs: await getTable(slug),
      lastUpdated: null,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Server function that can be called from client components
export const fetchDocumentFromServer = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    try {
      return getDocument(slug);
    } catch (err) {
      console.error(err);
      return null;
    }
  });

export interface RawDocument {
  body: string;
  title: string;
  description: string;
}

export const fetchRawDocument = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<RawDocument | null> => {
    try {
      const entry = await contentStore.getEntry(slug);
      if (!entry) return null;
      return {
        body: entry.body,
        title: entry.frontmatter.title,
        description: entry.frontmatter.description,
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  });

export async function getTable(
  slug: string
): Promise<{ level: number; text: string; href: string }[]> {
  const document = getIndexedDocument(slug);

  return (
    document?._searchMeta.headings.map((text) => ({
      level: 2,
      text,
      href: `#${innerslug(text)}`,
    })) ?? []
  );
}

function innerslug(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, "");
}

const pathIndexMap = new Map(
  PageRoutes.map((route, index) => [route.href, index])
);

export function getPreviousNext(path: string) {
  const index = pathIndexMap.get(`/${path}`);

  if (index === undefined || index === -1) {
    return { prev: null, next: null };
  }

  const prev = index > 0 ? PageRoutes[index - 1] : null;
  const next = index < PageRoutes.length - 1 ? PageRoutes[index + 1] : null;

  return { prev, next };
}

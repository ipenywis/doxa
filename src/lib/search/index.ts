import type MiniSearch from "minisearch";

import { hydrateFromJSON } from "./mini-search";
import { pickSnippet } from "./snippet";
import type { SearchIndexEntry, SearchResult } from "./types";

const INDEX_URL = "/search-data/index.json";

let indexPromise: Promise<MiniSearch | null> | null = null;

async function fetchIndex(): Promise<MiniSearch | null> {
  try {
    const response = await fetch(INDEX_URL);
    if (!response.ok) {
      console.warn(`[search] index fetch failed: ${response.status}`);
      return null;
    }
    const text = await response.text();
    return hydrateFromJSON(text);
  } catch (err) {
    console.warn("[search] index load error", err);
    return null;
  }
}

function getIndex(): Promise<MiniSearch | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!indexPromise) indexPromise = fetchIndex();
  return indexPromise;
}

export function preloadSearchIndex(): Promise<void> {
  return getIndex().then(() => undefined);
}

function extractTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export async function searchDocs(
  query: string,
  limit = 8
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const idx = await getIndex();
  if (!idx) return [];

  const hits = idx.search(trimmed);
  if (hits.length === 0) return [];

  const terms = extractTerms(trimmed);

  const results: SearchResult[] = [];
  for (const hit of hits.slice(0, limit)) {
    const stored = hit as unknown as {
      id: string;
      slug: string;
      title: string;
      breadcrumb?: string[];
      icon?: string;
      section?: string;
      lines?: SearchIndexEntry["lines"];
      score: number;
    };
    const snippet = pickSnippet(stored.lines, [...terms, ...hit.terms]);
    results.push({
      id: stored.id,
      slug: stored.slug,
      title: stored.title,
      breadcrumb: stored.breadcrumb ?? [],
      icon: stored.icon,
      section: stored.section,
      snippetLine: snippet.text,
      snippetAnchor: snippet.anchor,
      score: stored.score,
      terms: [...new Set([...terms, ...hit.terms.map((t) => t.toLowerCase())])],
    });
  }
  return results;
}

export type { SearchResult } from "./types";

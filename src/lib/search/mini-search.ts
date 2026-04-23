import MiniSearch from "minisearch";

import type { SearchIndexEntry } from "./types";

interface IndexableEntry extends SearchIndexEntry {
  headingsText: string;
  keywordsText: string;
}

const SEARCHABLE_FIELDS = [
  "title",
  "headingsText",
  "keywordsText",
  "content",
] as const;
const STORED_FIELDS = ["slug", "title", "breadcrumb", "icon", "lines"] as const;

const FIELD_BOOSTS = {
  title: 5,
  headingsText: 3,
  keywordsText: 2,
  content: 1,
} as const;

const SEARCH_OPTIONS = {
  prefix: true,
  fuzzy: 0.2,
  combineWith: "AND" as const,
  boost: FIELD_BOOSTS,
};

const INDEX_CONFIG = {
  idField: "id",
  fields: [...SEARCHABLE_FIELDS] as string[],
  storeFields: [...STORED_FIELDS] as string[],
  searchOptions: SEARCH_OPTIONS,
};

function toIndexable(entry: SearchIndexEntry): IndexableEntry {
  return {
    ...entry,
    headingsText: entry.headings.join(" "),
    keywordsText: entry.keywords.join(" "),
  };
}

export function buildIndex(
  entries: SearchIndexEntry[]
): MiniSearch<IndexableEntry> {
  const idx = new MiniSearch<IndexableEntry>(INDEX_CONFIG);
  idx.addAll(entries.map(toIndexable));
  return idx;
}

export function hydrateFromJSON(json: string): MiniSearch<IndexableEntry> {
  return MiniSearch.loadJSON<IndexableEntry>(json, INDEX_CONFIG);
}

export function serializeIndex(idx: MiniSearch<IndexableEntry>): string {
  return JSON.stringify(idx);
}

export { SEARCH_OPTIONS };

export interface SearchIndexLine {
  text: string;
  anchor?: string;
}

export interface SearchIndexEntry {
  id: string;
  slug: string;
  title: string;
  description: string;
  breadcrumb: string[];
  icon?: string;
  /** Section slug the page belongs to (matches sections.ts). */
  section: string;
  headings: string[];
  keywords: string[];
  content: string;
  lines: SearchIndexLine[];
}

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  breadcrumb: string[];
  icon?: string;
  section?: string;
  snippetLine: string;
  snippetAnchor?: string;
  score: number;
  terms: string[];
}

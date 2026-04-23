import documentsData from "../../public/search-data/documents.json";

export interface DocChunk {
  docPath: string;
  docTitle: string;
  sectionTitle: string;
  sectionAnchor: string;
  content: string;
  terms: string[];
}

interface DocIndex {
  chunks: DocChunk[];
  avgDocLength: number;
  idf: Map<string, number>;
}

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "if",
  "in",
  "into",
  "is",
  "it",
  "no",
  "not",
  "of",
  "on",
  "or",
  "such",
  "that",
  "the",
  "their",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "was",
  "will",
  "with",
]);

let index: DocIndex | null = null;

function innerslug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, "");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function stripMdx(content: string): string {
  let result = content;
  // Remove import lines
  result = result.replace(/^import\s+.*$/gm, "");
  // Remove JSX self-closing tags like <Component prop="value" />
  result = result.replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, "");
  // Remove JSX opening/closing tags but keep inner text
  result = result.replace(/<\/?[A-Z][a-zA-Z]*[^>]*>/g, "");
  // Remove HTML-like tags (lowercase) but keep inner text
  result = result.replace(/<\/?[a-z][a-zA-Z]*[^>]*>/g, "");
  // Remove frontmatter (already stripped by gray-matter, but just in case)
  result = result.replace(/^---[\s\S]*?---/m, "");
  // Remove code fences markers but keep content
  result = result.replace(/```[\w]*\n?/g, "");
  // Remove inline code backticks
  result = result.replace(/`([^`]+)`/g, "$1");
  // Remove markdown image syntax
  result = result.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Remove markdown link syntax, keep text
  result = result.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Remove bold/italic markers
  result = result.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");
  // Clean up extra whitespace
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

function chunkByHeadings(
  content: string,
  docPath: string,
  docTitle: string
): DocChunk[] {
  const stripped = stripMdx(content);
  const lines = stripped.split("\n");
  const chunks: DocChunk[] = [];
  let currentSection = docTitle;
  let currentAnchor = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s(.+)$/);
    if (headingMatch) {
      // Save previous chunk
      if (currentContent.length > 0) {
        const text = currentContent.join("\n").trim();
        if (text) {
          chunks.push({
            docPath,
            docTitle,
            sectionTitle: currentSection,
            sectionAnchor: currentAnchor ? `#${currentAnchor}` : "",
            content: text,
            terms: tokenize(text),
          });
        }
      }
      currentSection = headingMatch[2].trim();
      currentAnchor = innerslug(currentSection);
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Last chunk
  if (currentContent.length > 0) {
    const text = currentContent.join("\n").trim();
    if (text) {
      chunks.push({
        docPath,
        docTitle,
        sectionTitle: currentSection,
        sectionAnchor: currentAnchor ? `#${currentAnchor}` : "",
        content: text,
        terms: tokenize(text),
      });
    }
  }

  return chunks;
}

async function buildIndex(): Promise<DocIndex> {
  const allChunks: DocChunk[] = [];

  for (const document of documentsData) {
    const chunks = chunkByHeadings(
      document.content,
      document.slug,
      document.title
    );
    allChunks.push(...chunks);
  }

  // Compute IDF
  const docCount = allChunks.length;
  const termDocFreq = new Map<string, number>();
  for (const chunk of allChunks) {
    const uniqueTerms = new Set(chunk.terms);
    for (const term of uniqueTerms) {
      termDocFreq.set(term, (termDocFreq.get(term) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, freq] of termDocFreq) {
    idf.set(term, Math.log((docCount - freq + 0.5) / (freq + 0.5) + 1));
  }

  const avgDocLength =
    allChunks.reduce((sum, c) => sum + c.terms.length, 0) / (docCount || 1);

  return { chunks: allChunks, avgDocLength, idf };
}

export async function ensureIndex(): Promise<void> {
  if (!index) {
    index = await buildIndex();
  }
}

export function searchDocs(query: string, topK: number): DocChunk[] {
  if (!index) return [];

  const queryTerms = tokenize(query);
  const k1 = 1.5;
  const b = 0.75;

  const scores: { chunk: DocChunk; score: number }[] = [];

  for (const chunk of index.chunks) {
    let score = 0;
    const docLen = chunk.terms.length;
    const termFreqMap = new Map<string, number>();
    for (const t of chunk.terms) {
      termFreqMap.set(t, (termFreqMap.get(t) || 0) + 1);
    }

    for (const qt of queryTerms) {
      const tf = termFreqMap.get(qt) || 0;
      if (tf === 0) continue;
      const idfVal = index.idf.get(qt) || 0;
      const tfNorm =
        (tf * (k1 + 1)) /
        (tf + k1 * (1 - b + b * (docLen / index.avgDocLength)));
      score += idfVal * tfNorm;
    }

    if (score > 0) {
      scores.push({ chunk, score });
    }
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK).map((s) => s.chunk);
}

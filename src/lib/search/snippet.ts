import type { SearchIndexLine } from "./types";

const MAX_SNIPPET_LENGTH = 180;
const CONTEXT_RADIUS = 70;

interface ScoredLine {
  line: SearchIndexLine;
  score: number;
  firstMatchIndex: number;
}

function scoreLine(text: string, terms: string[]): ScoredLine["score"] {
  const lower = text.toLowerCase();
  let score = 0;
  const seen = new Set<string>();
  for (const term of terms) {
    if (!term) continue;
    const idx = lower.indexOf(term);
    if (idx === -1) continue;
    if (!seen.has(term)) {
      score += 10;
      seen.add(term);
    }
    if (idx < 40) score += 2;
  }
  return score;
}

function firstMatch(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  let earliest = -1;
  for (const term of terms) {
    if (!term) continue;
    const idx = lower.indexOf(term);
    if (idx === -1) continue;
    if (earliest === -1 || idx < earliest) earliest = idx;
  }
  return earliest;
}

function truncateAround(text: string, anchorIndex: number): string {
  if (text.length <= MAX_SNIPPET_LENGTH) return text;
  const start = Math.max(0, anchorIndex - CONTEXT_RADIUS);
  const end = Math.min(text.length, start + MAX_SNIPPET_LENGTH);
  const slice = text.slice(start, end).trim();
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${slice}${suffix}`;
}

export function pickSnippet(
  lines: SearchIndexLine[] | undefined,
  terms: string[]
): { text: string; anchor?: string } {
  if (!lines || lines.length === 0) return { text: "" };

  const lowerTerms = terms.map((t) => t.toLowerCase()).filter(Boolean);

  if (lowerTerms.length === 0) {
    const first = lines.find((l) => l.text.trim().length > 0) ?? lines[0];
    return {
      text: truncateAround(first.text, 0),
      anchor: first.anchor,
    };
  }

  let best: ScoredLine | null = null;
  for (const line of lines) {
    const score = scoreLine(line.text, lowerTerms);
    if (score === 0) continue;
    const firstMatchIndex = firstMatch(line.text, lowerTerms);
    if (!best || score > best.score) {
      best = { line, score, firstMatchIndex };
    }
  }

  if (!best) {
    const first = lines.find((l) => l.text.trim().length > 0) ?? lines[0];
    return {
      text: truncateAround(first.text, 0),
      anchor: first.anchor,
    };
  }

  return {
    text: truncateAround(best.line.text, Math.max(0, best.firstMatchIndex)),
    anchor: best.line.anchor,
  };
}

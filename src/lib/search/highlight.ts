function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function highlightTerms(text: string, terms: string[]): string {
  const escaped = escapeHtml(text)
  const cleanTerms = terms
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map(escapeRegex)
  if (cleanTerms.length === 0) return escaped
  const pattern = new RegExp(`(${cleanTerms.join("|")})`, "gi")
  return escaped.replace(pattern, '<mark class="search-highlight">$1</mark>')
}

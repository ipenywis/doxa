const STORAGE_KEY = "doxa:recent-searches";
const MAX_RECENT = 3;

export function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function saveRecent(query: string): string[] {
  if (typeof window === "undefined") return [];
  const trimmed = query.trim();
  if (!trimmed) return loadRecent();
  const current = loadRecent();
  const deduped = [trimmed, ...current.filter((q) => q !== trimmed)].slice(
    0,
    MAX_RECENT
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
  } catch {
    // ignore storage errors
  }
  return deduped;
}

export function clearRecent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export { MAX_RECENT };

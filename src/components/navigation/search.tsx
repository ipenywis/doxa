import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import {
  LuChevronRight,
  LuClock,
  LuFileText,
  LuSearch,
  LuSparkles,
} from "react-icons/lu";

import {
  defaultSection,
  getSectionBySlug,
  nonDefaultSections,
  visibleSections,
} from "@/src/settings/sections";
import {
  preloadSearchIndex,
  searchDocs,
  type SearchResult,
} from "@/src/lib/search";
import { highlightTerms } from "@/src/lib/search/highlight";
import { loadRecent, saveRecent } from "@/src/lib/search/recent";
import { cn } from "@/src/lib/utils";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { useChatContext } from "@/src/components/chat/chat-context";

const MIN_QUERY_LENGTH = 2;

type SectionFilter = "all" | string;

export default function Search() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all");
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { submitQuery } = useChatContext();

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= MIN_QUERY_LENGTH;
  const showSectionChips = nonDefaultSections.length > 0;

  const filteredResults = useMemo(() => {
    if (sectionFilter === "all") return results;
    return results.filter(
      (r) => (r.section ?? defaultSection.slug) === sectionFilter
    );
  }, [results, sectionFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const schedule =
      (window as Window & typeof globalThis).requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 200));
    const cancel =
      (window as Window & typeof globalThis).cancelIdleCallback ??
      ((id: number) => window.clearTimeout(id));
    const handle = schedule(() => {
      preloadSearchIndex();
    });
    return () => cancel(handle as number);
  }, []);

  useEffect(() => {
    if (isOpen) setRecent(loadRecent());
  }, [isOpen]);

  useEffect(() => {
    if (!hasQuery) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    let cancelled = false;
    searchDocs(trimmed).then((hits) => {
      if (cancelled) return;
      setResults(hits);
      setSelectedIndex(0);
    });
    return () => {
      cancelled = true;
    };
  }, [trimmed, hasQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [sectionFilter]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      saveRecent(trimmed);
      const href = `/docs${result.slug}${result.snippetAnchor ? `#${result.snippetAnchor}` : ""}`;
      navigate({ to: href });
      setIsOpen(false);
    },
    [navigate, trimmed]
  );

  const handleAskAi = useCallback(() => {
    if (!hasQuery) return;
    saveRecent(trimmed);
    submitQuery(`Tell me more about "${trimmed}"`);
    setIsOpen(false);
  }, [hasQuery, submitQuery, trimmed]);

  const runRecent = useCallback((q: string) => {
    setQuery(q);
    setSelectedIndex(0);
    inputRef.current?.focus();
  }, []);

  const activations = useMemo<(() => void)[]>(() => {
    if (hasQuery) {
      return [
        ...filteredResults.map((r) => () => navigateToResult(r)),
        () => handleAskAi(),
      ];
    }
    return recent.map((q) => () => runRecent(q));
  }, [
    hasQuery,
    filteredResults,
    recent,
    navigateToResult,
    handleAskAi,
    runRecent,
  ]);

  const selectedIndexRef = useRef(selectedIndex);
  const activationsRef = useRef(activations);
  selectedIndexRef.current = selectedIndex;
  activationsRef.current = activations;

  const handleKey = useCallback((event: React.KeyboardEvent) => {
    const items = activationsRef.current;
    if (items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      setSelectedIndex((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setSelectedIndex((i) => (i - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setSelectedIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setSelectedIndex(items.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      const idx = selectedIndexRef.current;
      const fn = items[idx];
      if (fn) fn();
    }
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector<HTMLElement>(
      "[data-search-selected='true']"
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setTimeout(() => {
            setQuery("");
            setResults([]);
            setSelectedIndex(0);
          }, 120);
        }
      }}
    >
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open search"
          className="relative flex h-9 w-full max-w-md cursor-pointer items-center rounded-md border bg-background pr-2 pl-10 text-left text-sm text-muted-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[260px] md:w-[320px] lg:w-[420px]"
        >
          <LuSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <span className="flex-1">Search documentation...</span>
          <kbd className="pointer-events-none hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=closed]:duration-75 data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:duration-75 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onKeyDown={handleKey}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          className="fixed top-[14px] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border bg-background shadow-lg outline-none data-[state=closed]:animate-out data-[state=closed]:duration-75 data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:duration-75 data-[state=open]:fade-in-0"
        >
          <DialogPrimitive.Title className="sr-only">
            Search documentation
          </DialogPrimitive.Title>
          <div className="relative flex items-center border-b">
            <LuSearch className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documentation..."
              className="h-11 w-full bg-transparent pr-14 pl-11 text-[15px] outline-none"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-3 hidden h-5 -translate-y-1/2 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              Esc
            </kbd>
          </div>

          {!hasQuery && query.length > 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Keep typing… at least {MIN_QUERY_LENGTH} characters
            </p>
          )}

          {!hasQuery && query.length === 0 && recent.length > 0 && (
            <div
              ref={listRef}
              className="flex flex-col items-stretch gap-0.5 px-2 pt-2 pr-3 pb-2 sm:pr-4"
            >
              <p className="px-3 pt-1 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Recent
              </p>
              {recent.map((q, i) => (
                <RecentRow
                  key={q}
                  query={q}
                  selected={i === selectedIndex}
                  onHover={() => setSelectedIndex(i)}
                  onClick={() => runRecent(q)}
                />
              ))}
            </div>
          )}

          {!hasQuery && query.length === 0 && recent.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Start typing to search the docs
            </p>
          )}

          {hasQuery && showSectionChips && (
            <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
              <SectionChip
                label="All"
                active={sectionFilter === "all"}
                onClick={() => setSectionFilter("all")}
              />
              {visibleSections.map((s) => (
                <SectionChip
                  key={s.slug}
                  label={s.label}
                  active={sectionFilter === s.slug}
                  onClick={() => setSectionFilter(s.slug)}
                />
              ))}
            </div>
          )}

          {hasQuery && (
            <ScrollArea className="max-h-[60vh] w-full">
              <div
                ref={listRef}
                className="flex w-full flex-col items-stretch gap-0.5 px-2 pt-2 pr-3 pb-2 sm:pr-4"
              >
                {filteredResults.length === 0 && (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    No results for{" "}
                    <span className="text-primary">{`"${trimmed}"`}</span>
                  </p>
                )}

                {filteredResults.map((result, index) => (
                  <SearchResultRow
                    key={result.id}
                    result={result}
                    selected={index === selectedIndex}
                    onHover={() => setSelectedIndex(index)}
                    onClick={() => navigateToResult(result)}
                  />
                ))}

                <AskAiRow
                  query={trimmed}
                  selected={selectedIndex === filteredResults.length}
                  onHover={() => setSelectedIndex(filteredResults.length)}
                  onClick={handleAskAi}
                />
              </div>
            </ScrollArea>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface RowProps {
  result: SearchResult;
  selected: boolean;
  onHover: () => void;
  onClick: () => void;
}

function SearchResultRow({ result, selected, onHover, onClick }: RowProps) {
  const href = `/docs${result.slug}${result.snippetAnchor ? `#${result.snippetAnchor}` : ""}`;
  const snippetHtml = useMemo(
    () => highlightTerms(result.snippetLine, result.terms),
    [result.snippetLine, result.terms]
  );
  const sectionLabel = useMemo(() => {
    if (nonDefaultSections.length === 0) return null;
    const slug = result.section ?? defaultSection.slug;
    return getSectionBySlug(slug)?.label ?? null;
  }, [result.section]);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    onClick();
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={onHover}
      data-search-selected={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-md px-3 py-2.5",
        selected ? "bg-accent" : "hover:bg-accent/60"
      )}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
        <LuFileText className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {result.breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {result.breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1 truncate">
                {i > 0 && <LuChevronRight className="h-3 w-3 shrink-0" />}
                <span className="truncate">{crumb}</span>
              </span>
            ))}
          </div>
        )}
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-primary">
            {result.title}
          </span>
          {sectionLabel && (
            <span className="shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {sectionLabel}
            </span>
          )}
        </div>
        {result.snippetLine && (
          <p
            className="line-clamp-2 text-xs leading-snug text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: snippetHtml }}
          />
        )}
      </div>
    </a>
  );
}

function AskAiRow({
  query,
  selected,
  onHover,
  onClick,
}: {
  query: string;
  selected: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-search-selected={selected}
      onMouseEnter={onHover}
      onClick={onClick}
      className={cn(
        "mt-1 flex w-full items-center gap-3 rounded-md border border-dashed px-3 py-2.5 text-left",
        selected ? "border-primary/50 bg-accent" : "hover:bg-accent/60"
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <LuSparkles className="h-4 w-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Ask AI</span>
        <span className="truncate text-[14px] font-medium text-primary">
          Tell me more about <span className="italic">&quot;{query}&quot;</span>
        </span>
      </span>
    </button>
  );
}

function SectionChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function RecentRow({
  query,
  selected,
  onHover,
  onClick,
}: {
  query: string;
  selected: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-search-selected={selected}
      onClick={onClick}
      onMouseEnter={onHover}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left",
        selected ? "bg-accent" : "hover:bg-accent/60"
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
        <LuClock className="h-3.5 w-3.5" />
      </span>
      <span className="truncate text-[14px] text-foreground">{query}</span>
    </button>
  );
}

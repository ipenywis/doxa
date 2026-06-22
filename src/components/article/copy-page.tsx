import { useState } from "react";
import {
  LuCheck,
  LuChevronDown,
  LuCopy,
  LuFileCode,
  LuFileText,
} from "react-icons/lu";

import { type RawDocument } from "@/src/lib/markdown";
import { cn } from "@/src/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

type DeferredRawDoc =
  | RawDocument
  | Promise<RawDocument | null>
  | (() => RawDocument | Promise<RawDocument | null> | null | undefined)
  | null
  | undefined;

interface CopyPageOptions {
  markdown: boolean;
  rawText: boolean;
}

function composeMarkdown(doc: RawDocument) {
  const parts = [`# ${doc.title}`];
  if (doc.description) parts.push(doc.description);
  parts.push(doc.body.trim());
  return parts.join("\n\n");
}

function composeText(title: string, description?: string) {
  const article = document.querySelector<HTMLElement>(".prose-content");
  const body = article?.innerText.trim() ?? "";
  const parts = [title];
  if (description) parts.push(description);
  if (body) parts.push(body);
  return parts.join("\n\n");
}

async function resolveDeferredRawDoc(
  rawDoc: DeferredRawDoc
): Promise<RawDocument | null> {
  try {
    const doc = typeof rawDoc === "function" ? rawDoc() : rawDoc;
    return (await Promise.resolve(doc)) ?? null;
  } catch {
    return null;
  }
}

export function CopyPage({
  options,
  rawDoc,
  title,
  description,
}: {
  options: CopyPageOptions;
  rawDoc: DeferredRawDoc;
  title: string;
  description?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const hasMultipleOptions = options.markdown && options.rawText;
  const primaryCopyAction = options.markdown ? copyMarkdown : copyText;
  const primaryCopyLabel = options.markdown
    ? "Copy page as markdown"
    : "Copy page as text";

  function flashCopied() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyMarkdown() {
    const doc = await resolveDeferredRawDoc(rawDoc);
    if (!doc) return;
    await navigator.clipboard.writeText(composeMarkdown(doc));
    flashCopied();
  }

  async function copyText() {
    await navigator.clipboard.writeText(composeText(title, description));
    flashCopied();
  }

  if (!options.markdown && !options.rawText) return null;

  return (
    <div className="inline-flex h-8 shrink-0 items-stretch overflow-hidden rounded-md border bg-background shadow-xs dark:bg-input/30">
      <button
        type="button"
        onClick={primaryCopyAction}
        aria-label={primaryCopyLabel}
        className="inline-flex cursor-pointer items-center gap-1.5 px-3 text-xs font-medium outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset dark:hover:bg-input/50"
      >
        <span className="relative inline-flex size-3.5 items-center justify-center">
          <LuCopy
            className={cn(
              "absolute size-3.5 transition-opacity duration-75",
              copied ? "opacity-0" : "opacity-100"
            )}
          />
          <LuCheck
            className={cn(
              "absolute size-3.5 transition-opacity duration-75",
              copied ? "opacity-100" : "opacity-0"
            )}
          />
        </span>
        <span>{copied ? "Copied" : "Copy page"}</span>
      </button>
      {hasMultipleOptions && (
        <>
          <div className="w-px self-stretch bg-border" />
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
              aria-label="Copy options"
              className="inline-flex cursor-pointer items-center px-2 outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset data-[state=open]:bg-accent dark:hover:bg-input/50"
            >
              <LuChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem
                onSelect={copyMarkdown}
                className="cursor-pointer"
              >
                <LuFileCode className="size-4" />
                <div className="flex flex-col">
                  <span>Copy as Markdown</span>
                  <span className="text-xs text-muted-foreground">
                    Copy as markdown
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copyText} className="cursor-pointer">
                <LuFileText className="size-4" />
                <div className="flex flex-col">
                  <span>Copy as text</span>
                  <span className="text-xs text-muted-foreground">
                    Plain text
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

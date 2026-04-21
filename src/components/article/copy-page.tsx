import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { type RawDocument } from "@/src/lib/markdown"
import { cn } from "@/src/lib/utils"
import {
  LuCheck,
  LuChevronDown,
  LuCopy,
  LuFileCode,
  LuFileText,
} from "react-icons/lu"

type DeferredRawDoc =
  | RawDocument
  | Promise<RawDocument | null>
  | null
  | undefined

function composeMarkdown(doc: RawDocument) {
  const parts = [`# ${doc.title}`]
  if (doc.description) parts.push(doc.description)
  parts.push(doc.body.trim())
  return parts.join("\n\n")
}

function composeText(title: string, description?: string) {
  const article = document.querySelector<HTMLElement>(".prose-content")
  const body = article?.innerText.trim() ?? ""
  const parts = [title]
  if (description) parts.push(description)
  if (body) parts.push(body)
  return parts.join("\n\n")
}

export function CopyPage({
  rawDoc,
  title,
  description,
}: {
  rawDoc: DeferredRawDoc
  title: string
  description?: string
}) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  function flashCopied() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function copyMarkdown() {
    const doc = await Promise.resolve(rawDoc)
    if (!doc) return
    await navigator.clipboard.writeText(composeMarkdown(doc))
    flashCopied()
  }

  async function copyText() {
    await navigator.clipboard.writeText(composeText(title, description))
    flashCopied()
  }

  return (
    <div className="inline-flex h-8 shrink-0 items-stretch overflow-hidden rounded-md border bg-background shadow-xs dark:bg-input/30">
      <button
        type="button"
        onClick={copyMarkdown}
        aria-label="Copy page as markdown"
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
      <div className="w-px self-stretch bg-border" />
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          aria-label="Copy options"
          className="inline-flex cursor-pointer items-center px-2 outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset data-[state=open]:bg-accent dark:hover:bg-input/50"
        >
          <LuChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onSelect={copyMarkdown} className="cursor-pointer">
            <LuFileCode className="size-4" />
            <div className="flex flex-col">
              <span>Copy as Markdown</span>
              <span className="text-xs text-muted-foreground">
                Raw MDX source
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={copyText} className="cursor-pointer">
            <LuFileText className="size-4" />
            <div className="flex flex-col">
              <span>Copy as Text</span>
              <span className="text-xs text-muted-foreground">Plain text</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

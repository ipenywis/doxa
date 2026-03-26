import { useCallback, useEffect, useRef } from "react"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypePrism from "rehype-prism-plus"
import type { ChatMessage } from "@/src/components/chat"
import { ToolCallList, type ToolCallStep } from "@/src/components/chat/tool-call-display"

/**
 * Close any unclosed code fences so react-markdown renders partial
 * code blocks correctly during streaming.
 */
function sanitizeStreamingMarkdown(text: string): string {
  const fences = text.match(/```/g)
  if (fences && fences.length % 2 !== 0) {
    return text + "\n```"
  }
  return text
}

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  scrollToMsgId: string | null
  /** Live tool call steps for the current streaming response. */
  activeToolSteps?: ToolCallStep[]
}

function DocLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href?.startsWith("/docs")) {
    return (
      <a
        href={href}
        className="text-primary underline underline-offset-2 hover:text-primary/80"
        {...props}
      >
        {children}
      </a>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      {...props}
    >
      {children}
    </a>
  )
}

function LoadingDots() {
  return (
    <div className="flex max-w-[85%] items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
    </div>
  )
}

function StreamingCursor() {
  return (
    <span className="streaming-cursor ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] rounded-full bg-foreground/70" />
  )
}

const markdownComponents: Components = {
  a: DocLink,
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 leading-relaxed text-foreground/90 last:mb-0">{children}</p>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-3 mt-4 text-base font-semibold tracking-tight text-foreground first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-2 mt-4 text-sm font-semibold tracking-tight text-foreground first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-2 mt-3 text-sm font-medium text-foreground first:mt-0">{children}</h3>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-foreground/90 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 text-foreground/90 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-foreground/80">{children}</em>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-3 border-l-2 border-primary/40 pl-3 text-foreground/70 italic">{children}</blockquote>
  ),
  hr: () => (
    <hr className="my-4 border-border/50" />
  ),
  code: ({
    children,
    className,
  }: {
    children?: React.ReactNode
    className?: string
  }) => {
    const isBlock = className?.startsWith("language-")
    if (isBlock) {
      return (
        <code className={`block text-xs leading-relaxed ${className}`}>
          {children}
        </code>
      )
    }
    return (
      <code className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
        {children}
      </code>
    )
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="chat-code-block mb-3 overflow-x-auto rounded-md border border-border/30 bg-muted/80 p-3 last:mb-0">{children}</pre>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="mb-3 overflow-x-auto rounded-md border border-border/40">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="border-b border-border/40 bg-muted/50">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-1.5 text-left font-medium text-foreground">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-1.5 text-foreground/80">{children}</td>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="border-b border-border/20 last:border-0">{children}</tr>
  ),
}

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  scrollToMsgId,
  activeToolSteps = [],
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentEndRef = useRef<HTMLDivElement>(null)
  // 'follow' = auto-scroll to follow content, 'manual' = user scrolled up
  const scrollModeRef = useRef<"follow" | "manual">("follow")
  // Tracks programmatic scrolls so handleScroll ignores them
  const isProgrammaticRef = useRef(false)
  const processedScrollId = useRef<string | null>(null)

  // Programmatic scroll helper — prevents handleScroll from switching to manual
  const scrollTo = useCallback(
    (top: number, smooth = false) => {
      const el = scrollRef.current
      if (!el) return
      isProgrammaticRef.current = true
      el.scrollTo({ top, behavior: smooth ? "smooth" : "instant" })
      if (smooth) {
        // Keep the lock for the duration of the smooth scroll animation
        setTimeout(() => {
          isProgrammaticRef.current = false
        }, 500)
      } else {
        requestAnimationFrame(() => {
          isProgrammaticRef.current = false
        })
      }
    },
    []
  )

  // ── Scroll-to-top & auto-follow: disabled for now ──────────────
  // Set to `true` to re-enable the scroll-to-top-on-send, auto-follow
  // during streaming, and persistent spacer below messages.
  const ENABLE_SCROLL_BEHAVIOUR = false

  // Detect user-initiated scrolls to toggle follow/manual mode
  const handleScroll = useCallback(() => {
    if (!ENABLE_SCROLL_BEHAVIOUR) return
    if (isProgrammaticRef.current) return
    const el = scrollRef.current
    if (!el) return
    const threshold = 80
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    scrollModeRef.current = atBottom ? "follow" : "manual"
  }, [])

  // 1) Scroll user message to the top of the container when they send
  useEffect(() => {
    if (!ENABLE_SCROLL_BEHAVIOUR) return
    if (!scrollToMsgId || scrollToMsgId === processedScrollId.current)
      return
    processedScrollId.current = scrollToMsgId
    const el = scrollRef.current
    if (!el) return

    // Wait for DOM to render the new messages + spacer
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const msgEl = el.querySelector(
          `[data-msg-id="${scrollToMsgId}"]`
        ) as HTMLElement | null
        if (!msgEl) return
        // Use getBoundingClientRect for reliable positioning
        const containerRect = el.getBoundingClientRect()
        const msgRect = msgEl.getBoundingClientRect()
        const relativeTop =
          msgRect.top - containerRect.top + el.scrollTop
        scrollModeRef.current = "follow"
        scrollTo(relativeTop - 16, true)
      })
    })
  }, [scrollToMsgId, scrollTo])

  // 2) Auto-follow streaming content (including tool steps)
  useEffect(() => {
    if (!ENABLE_SCROLL_BEHAVIOUR) return
    if (scrollModeRef.current !== "follow") return
    if (!isStreaming && !isLoading) return

    const marker = contentEndRef.current
    const el = scrollRef.current
    if (!marker || !el) return

    const containerRect = el.getBoundingClientRect()
    const markerRect = marker.getBoundingClientRect()

    // Only scroll down if the content end has gone below the visible area
    if (markerRect.bottom > containerRect.bottom - 8) {
      const relativeBottom =
        markerRect.bottom - containerRect.top + el.scrollTop
      scrollTo(relativeBottom - el.clientHeight + 16)
    }
  }, [messages, isStreaming, isLoading, activeToolSteps, scrollTo])

  // 3) When streaming ends, scroll to the content end (not the absolute bottom)
  //    so the response is visible with breathing room below.
  useEffect(() => {
    if (!ENABLE_SCROLL_BEHAVIOUR) return
    if (!isStreaming && !isLoading && scrollModeRef.current === "follow") {
      const el = scrollRef.current
      const marker = contentEndRef.current
      if (el && marker) {
        requestAnimationFrame(() => {
          const containerRect = el.getBoundingClientRect()
          const markerRect = marker.getBoundingClientRect()
          const relativeBottom =
            markerRect.bottom - containerRect.top + el.scrollTop
          scrollTo(relativeBottom - el.clientHeight + 16)
        })
      }
    }
  }, [isStreaming, isLoading, scrollTo])

  // Always auto-scroll to the bottom when content changes
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, activeToolSteps])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 text-center">
        <p className="mb-3 text-sm font-medium text-foreground">
          Chat with the docs
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Ask anything about the documentation and get instant answers with
          links to relevant sections.
        </p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>Try asking:</p>
          <p className="italic">&quot;How do I get started?&quot;</p>
          <p className="italic">&quot;What components are available?&quot;</p>
          <p className="italic">&quot;How do I add a new page?&quot;</p>
        </div>
      </div>
    )
  }

  const lastMsg = messages[messages.length - 1]
  const showLoadingDots =
    isLoading && !isStreaming && lastMsg?.role === "user"
  const streamingMsgId =
    isStreaming && lastMsg?.role === "assistant" ? lastMsg.id : null

  // Show active tool steps when streaming and no text content yet
  const showActiveToolSteps =
    isStreaming && activeToolSteps.length > 0

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="chat-drawer-scroll flex-1 overflow-y-auto overscroll-contain"
    >
      <div className="flex flex-col gap-3 p-4">
        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <div
                key={msg.id}
                data-msg-id={msg.id}
                className="flex justify-end"
              >
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                  {msg.content}
                </div>
              </div>
            )
          }

          if (msg.role === "assistant") {
            const isCurrentlyStreaming = msg.id === streamingMsgId

            // Show persisted tool steps for completed messages
            const persistedSteps = msg.toolSteps && msg.toolSteps.length > 0

            return (
              <div key={msg.id} className="flex flex-col gap-1">
                {/* Persisted tool steps (from history or after streaming completes) */}
                {persistedSteps && !isCurrentlyStreaming && (
                  <ToolCallList steps={msg.toolSteps!} />
                )}

                {/* Active tool steps during streaming */}
                {isCurrentlyStreaming && showActiveToolSteps && (
                  <ToolCallList steps={activeToolSteps} />
                )}

                {/* Loading dots while waiting for first content */}
                {isCurrentlyStreaming && !msg.content && activeToolSteps.length === 0 && (
                  <div className="flex justify-start">
                    <LoadingDots />
                  </div>
                )}

                {/* Message content */}
                {msg.content && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm">
                      <div className="chat-prose">
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[[rehypePrism, { ignoreMissing: true }]]}
                          components={markdownComponents}
                        >
                          {isCurrentlyStreaming
                            ? sanitizeStreamingMarkdown(msg.content)
                            : msg.content}
                        </Markdown>
                        {isCurrentlyStreaming && <StreamingCursor />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          }

          return null
        })}
        {showLoadingDots && (
          <div className="flex justify-start">
            <LoadingDots />
          </div>
        )}
        {/* Bottom padding — breathing room below the last message */}
        <div className="pointer-events-none shrink-0 select-none min-h-[20vh] sm:min-h-[15vh]" aria-hidden="true" />
        {/* Scroll anchor — auto-scroll targets here, after the padding */}
        <div ref={contentEndRef} aria-hidden="true" />
        {/* Spacer — fills the rest of the viewport so the user message
            can be scrolled to the very top with empty space below it.
            Only active when ENABLE_SCROLL_BEHAVIOUR is true. */}
        {ENABLE_SCROLL_BEHAVIOUR && (
          <div
            className="pointer-events-none shrink-0 select-none"
            style={{ minHeight: "calc(100vh - 7rem)" }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  )
}

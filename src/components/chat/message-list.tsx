import { useCallback, useEffect, useRef } from "react"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ChatMessage } from "@/src/components/chat"

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  scrollToMsgId: string | null
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
    <p className="mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-2 list-disc pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-2 list-decimal pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="mb-1">{children}</li>
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
        <code className="block overflow-x-auto rounded bg-muted p-3 text-xs">
          {children}
        </code>
      )
    }
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
        {children}
      </code>
    )
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="mb-2 last:mb-0">{children}</pre>
  ),
}

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  scrollToMsgId,
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

  // Detect user-initiated scrolls to toggle follow/manual mode
  const handleScroll = useCallback(() => {
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

  // 2) Auto-follow streaming content
  useEffect(() => {
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
  }, [messages, isStreaming, isLoading, scrollTo])

  // 3) When streaming ends, snap to the real bottom (spacer collapses)
  useEffect(() => {
    if (!isStreaming && !isLoading && scrollModeRef.current === "follow") {
      const el = scrollRef.current
      if (el) {
        requestAnimationFrame(() => {
          scrollTo(el.scrollHeight)
        })
      }
    }
  }, [isStreaming, isLoading, scrollTo])

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
            if (isCurrentlyStreaming && !msg.content) {
              return (
                <div key={msg.id} className="flex justify-start">
                  <LoadingDots />
                </div>
              )
            }
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm">
                  {isCurrentlyStreaming ? (
                    <>
                      <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">
                        {msg.content}
                      </p>
                      <StreamingCursor />
                    </>
                  ) : (
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {msg.content}
                    </Markdown>
                  )}
                </div>
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
        {/* Scroll anchor — auto-scroll targets here, before the spacer */}
        <div ref={contentEndRef} aria-hidden="true" />
        {/* Spacer — fills the rest of the viewport so the user message
            can be scrolled to the very top with empty space below it */}
        <div
          className="pointer-events-none shrink-0 select-none transition-[min-height] duration-500 ease-out"
          style={{
            minHeight:
              isLoading || isStreaming ? "calc(100vh - 10rem)" : 0,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

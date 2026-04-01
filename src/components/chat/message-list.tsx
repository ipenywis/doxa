import { useCallback, useEffect, useRef } from "react"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypePrism from "rehype-prism-plus"
import type { ChatMessage } from "@/src/components/chat"
import { useChatContext } from "@/src/components/chat/chat-context"
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
      <code className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.8125em] font-medium text-primary before:content-none after:content-none">
        {children}
      </code>
    )
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="chat-code-block overflow-x-auto rounded-md border border-border/30 bg-muted/80 p-3">{children}</pre>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto rounded-md border border-border/40">
      <table className="w-full">{children}</table>
    </div>
  ),
}

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  scrollToMsgId,
  activeToolSteps = [],
}: MessageListProps) {
  const { isOpen } = useChatContext()
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentEndRef = useRef<HTMLDivElement>(null)
  const streamFollowModeRef = useRef<"follow" | "manual">("follow")
  const isProgrammaticRef = useRef(false)
  const processedScrollId = useRef<string | null>(null)

  const STREAM_FOLLOW_THRESHOLD_PX = 80

  const getDistanceFromBottom = useCallback((el: HTMLDivElement) => {
    return el.scrollHeight - el.scrollTop - el.clientHeight
  }, [])

  const scrollToBottomImmediately = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    isProgrammaticRef.current = true
    el.scrollTop = el.scrollHeight
    requestAnimationFrame(() => {
      isProgrammaticRef.current = false
    })
  }, [])

  const handleScroll = useCallback(() => {
    if (isProgrammaticRef.current) return
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = getDistanceFromBottom(el)
    streamFollowModeRef.current =
      distanceFromBottom <= STREAM_FOLLOW_THRESHOLD_PX
        ? "follow"
        : "manual"
  }, [getDistanceFromBottom, STREAM_FOLLOW_THRESHOLD_PX])

  // A newly-sent message should always start in follow mode.
  useEffect(() => {
    if (!scrollToMsgId || scrollToMsgId === processedScrollId.current) return

    processedScrollId.current = scrollToMsgId
    streamFollowModeRef.current = "follow"

    requestAnimationFrame(() => {
      scrollToBottomImmediately()
    })
  }, [scrollToBottomImmediately, scrollToMsgId])

  // While streaming, stay pinned to the latest content until the user scrolls away.
  useEffect(() => {
    if (!isStreaming && !isLoading) return
    if (streamFollowModeRef.current !== "follow") return

    requestAnimationFrame(() => {
      if (streamFollowModeRef.current === "follow") {
        scrollToBottomImmediately()
      }
    })
  }, [
    activeToolSteps,
    isLoading,
    isStreaming,
    messages,
    scrollToBottomImmediately,
  ])

  // Jump straight to the latest message whenever the drawer opens.
  useEffect(() => {
    if (!isOpen || messages.length === 0) return

    streamFollowModeRef.current = "follow"
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottomImmediately()
      })
    })
  }, [isOpen, messages.length, scrollToBottomImmediately])

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
                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm">
                      <div className="chat-prose prose prose-sm dark:prose-invert prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-1.5 prose-a:text-primary prose-strong:text-foreground prose-strong:font-semibold prose-em:text-foreground/80 prose-blockquote:border-primary/40 prose-blockquote:text-foreground/70 prose-code:text-primary prose-pre:bg-transparent prose-pre:p-0 prose-li:text-foreground/90 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-th:text-foreground prose-td:text-foreground/80 prose-hr:my-2 max-w-none">
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
      </div>
    </div>
  )
}

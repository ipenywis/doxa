import { useCallback, useEffect, useRef } from "react"
import Markdown, { type Components } from "react-markdown"
import { LuFileText } from "react-icons/lu"
import remarkGfm from "remark-gfm"
import rehypePrism from "rehype-prism-plus"
import type {
  ChatMessage,
  MessagePart,
  ToolPart,
} from "@/src/components/chat"
import { AgentActivityFooter } from "@/src/components/chat/agent-activity"
import { useChatContext } from "@/src/components/chat/chat-context"
import {
  ToolCallDisplay,
  type ToolCallStep,
} from "@/src/components/chat/tool-call-display"
import { Link } from "@/src/lib/transition"

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
}

function DocLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href?.startsWith("/")
  if (isInternal && href) {
    return (
      <Link
        href={href}
        className="text-primary underline underline-offset-2 hover:text-primary/80"
        {...props}
      >
        {children}
      </Link>
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

interface TextBubbleProps {
  content: string
  isStreaming: boolean
}

function TextBubble({ content, isStreaming }: TextBubbleProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm">
        <div className="chat-prose prose prose-sm dark:prose-invert prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-1.5 prose-a:text-primary prose-strong:text-foreground prose-strong:font-semibold prose-em:text-foreground/80 prose-blockquote:border-primary/40 prose-blockquote:text-foreground/70 prose-code:text-primary prose-pre:bg-transparent prose-pre:p-0 prose-li:text-foreground/90 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-th:text-foreground prose-td:text-foreground/80 prose-hr:my-2 max-w-none">
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypePrism, { ignoreMissing: true }]]}
            components={markdownComponents}
          >
            {isStreaming ? sanitizeStreamingMarkdown(content) : content}
          </Markdown>
          {isStreaming && <StreamingCursor />}
        </div>
      </div>
    </div>
  )
}

function parseToolDisplayArg(step: ToolCallStep): string {
  const raw = step.args
  if (!raw) return ""
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const file = typeof parsed.file === "string" ? parsed.file : null
    const pattern = typeof parsed.pattern === "string" ? parsed.pattern : null
    const command = typeof parsed.command === "string" ? parsed.command : null
    return file ?? pattern ?? command ?? raw
  } catch {
    return raw
  }
}

function truncate(text: string, max = 48): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + "…"
}

function describeActiveTool(step: ToolCallStep): string {
  const verb =
    step.name === "cat"
      ? "Reading"
      : step.name === "grep"
        ? "Searching"
        : `Running ${step.name}`
  const arg = parseToolDisplayArg(step)
  if (!arg) return `${verb}…`
  return `${verb} ${truncate(arg)}`
}

function computeAgentStatus(parts: MessagePart[] | undefined): string | null {
  if (!parts) return "Thinking…"

  const activeTool = parts.find(
    (p): p is ToolPart =>
      p.type === "tool" &&
      (p.step.status === "calling" || p.step.status === "executing")
  )
  if (activeTool) return describeActiveTool(activeTool.step)

  const last = parts[parts.length - 1]
  if (last && last.type === "text" && last.content.length > 0) {
    // Text is actively streaming — StreamingCursor covers the visual.
    return null
  }
  return "Thinking…"
}

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  scrollToMsgId,
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
      distanceFromBottom <= STREAM_FOLLOW_THRESHOLD_PX ? "follow" : "manual"
  }, [getDistanceFromBottom, STREAM_FOLLOW_THRESHOLD_PX])

  useEffect(() => {
    if (!scrollToMsgId || scrollToMsgId === processedScrollId.current) return

    processedScrollId.current = scrollToMsgId
    streamFollowModeRef.current = "follow"

    requestAnimationFrame(() => {
      scrollToBottomImmediately()
    })
  }, [scrollToBottomImmediately, scrollToMsgId])

  useEffect(() => {
    if (!isStreaming && !isLoading) return
    if (streamFollowModeRef.current !== "follow") return

    requestAnimationFrame(() => {
      if (streamFollowModeRef.current === "follow") {
        scrollToBottomImmediately()
      }
    })
  }, [isLoading, isStreaming, messages, scrollToBottomImmediately])

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
                className="flex flex-col items-end gap-1"
              >
                {msg.pageContext && (
                  <div
                    className="flex max-w-[85%] items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs text-primary"
                    title={`Attached page: ${msg.pageContext.title}`}
                  >
                    <LuFileText className="size-3.5 shrink-0" />
                    <span className="min-w-0 truncate">
                      {msg.pageContext.title}
                    </span>
                  </div>
                )}
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                  {msg.content}
                </div>
              </div>
            )
          }

          if (msg.role === "assistant") {
            const isCurrentlyStreaming = msg.id === streamingMsgId
            // Legacy support: messages persisted before parts-refactor.
            const parts: MessagePart[] | undefined =
              msg.parts && msg.parts.length > 0
                ? msg.parts
                : msg.content
                  ? [{ type: "text", id: `legacy-${msg.id}`, content: msg.content }]
                  : undefined

            const lastIdx = parts ? parts.length - 1 : -1
            const agentStatus = isCurrentlyStreaming
              ? computeAgentStatus(parts)
              : null

            return (
              <div key={msg.id} className="flex flex-col gap-1">
                {parts?.map((part, idx) => {
                  if (part.type === "tool") {
                    return <ToolCallDisplay key={part.id} step={part.step} />
                  }
                  const isLastPart = idx === lastIdx
                  return (
                    <TextBubble
                      key={part.id}
                      content={part.content}
                      isStreaming={isCurrentlyStreaming && isLastPart}
                    />
                  )
                })}

                {agentStatus && (
                  <AgentActivityFooter status={agentStatus} />
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
        {/* Scroll anchor */}
        <div ref={contentEndRef} aria-hidden="true" />
      </div>
    </div>
  )
}

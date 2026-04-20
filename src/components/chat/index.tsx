import { useCallback, useEffect, useRef, useState } from "react"
import { ChatDrawer } from "@/src/components/chat/chat-drawer"
import { ChatInput } from "@/src/components/chat/chat-input"
import { HistoryPanel } from "@/src/components/chat/history-panel"
import { MessageList } from "@/src/components/chat/message-list"
import type { ToolCallStep } from "@/src/components/chat/tool-call-display"
import { useConversationHistory } from "@/src/components/chat/use-conversation-history"
import { chatWithDocsStream } from "@/src/lib/chat-api"

export interface TextPart { type: "text"; id: string; content: string }
export interface ToolPart { type: "tool"; id: string; step: ToolCallStep }
export type MessagePart = TextPart | ToolPart

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  /** User messages: raw text. Assistant messages: legacy — prefer `parts`. */
  content?: string
  /** Assistant only: ordered text + tool timeline. */
  parts?: MessagePart[]
  /** @deprecated replaced by `parts`. Kept for loading legacy conversations. */
  toolSteps?: ToolCallStep[]
}

let msgCounter = 0
let partCounter = 0
const genPartId = () => `part-${++partCounter}`

function migrateMessage(msg: ChatMessage): ChatMessage {
  if (msg.role !== "assistant") return msg
  if (msg.parts && msg.parts.length > 0) return msg

  const parts: MessagePart[] = []
  if (msg.toolSteps && msg.toolSteps.length > 0) {
    for (const step of msg.toolSteps) {
      parts.push({ type: "tool", id: step.id, step })
    }
  }
  if (msg.content && msg.content.length > 0) {
    parts.push({ type: "text", id: genPartId(), content: msg.content })
  }

  return { id: msg.id, role: msg.role, parts }
}

function migrateMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(migrateMessage)
}

function messageToApiContent(m: ChatMessage): string {
  if (m.role === "user") return m.content ?? ""
  if (m.parts && m.parts.length > 0) {
    return m.parts
      .filter((p): p is TextPart => p.type === "text")
      .map((p) => p.content)
      .join("\n\n")
  }
  return m.content ?? ""
}

export function ChatWithDocs() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [scrollToMsgId, setScrollToMsgId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const bufferRef = useRef("")
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null)
  /** Ordered parts for the currently streaming assistant message. */
  const partsRef = useRef<MessagePart[]>([])
  /** Direct lookup of tool parts by toolCallId. */
  const toolPartByIdRef = useRef<Map<string, ToolPart>>(new Map())
  /** ID of the assistant message currently being streamed into. */
  const streamingMsgIdRef = useRef<string | null>(null)

  const history = useConversationHistory()

  useEffect(() => {
    if (!history.hasLoaded || conversationIdRef.current) return

    const latestConversation = history.conversations[0]
    if (latestConversation) {
      conversationIdRef.current = latestConversation.id
      setMessages(migrateMessages(latestConversation.messages))
      return
    }

    conversationIdRef.current = history.generateId()
  }, [history.conversations, history.generateId, history.hasLoaded])

  useEffect(() => {
    if (conversationIdRef.current && messages.length > 0 && !isStreaming) {
      history.saveConversation(conversationIdRef.current, messages)
    }
  }, [messages, isStreaming, history.saveConversation])

  useEffect(() => {
    if (scrollToMsgId) {
      const timer = setTimeout(() => setScrollToMsgId(null), 200)
      return () => clearTimeout(timer)
    }
  }, [scrollToMsgId])

  useEffect(() => {
    return () => {
      if (drainRef.current) clearInterval(drainRef.current)
    }
  }, [])

  /** Snapshot parts-ref into state for the streaming assistant message. */
  const syncPartsToMessage = useCallback(() => {
    const assistantMsgId = streamingMsgIdRef.current
    if (!assistantMsgId) return
    const snapshot: MessagePart[] = partsRef.current.map((p) =>
      p.type === "text"
        ? { ...p }
        : { type: "tool", id: p.id, step: { ...p.step } }
    )
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantMsgId ? { ...m, parts: snapshot } : m
      )
    )
  }, [])

  /** Get the trailing text part, creating one if absent or if the last part is a tool. */
  const ensureTrailingTextPart = useCallback((): TextPart => {
    const last = partsRef.current[partsRef.current.length - 1]
    if (last && last.type === "text") return last
    const created: TextPart = { type: "text", id: genPartId(), content: "" }
    partsRef.current.push(created)
    return created
  }, [])

  /** Flush buffered text immediately into the trailing text part (synchronous). */
  const flushBufferNow = useCallback(() => {
    if (bufferRef.current.length === 0) return
    const part = ensureTrailingTextPart()
    part.content += bufferRef.current
    bufferRef.current = ""
  }, [ensureTrailingTextPart])

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: `msg-${++msgCounter}`,
        role: "user",
        content: text,
      }

      const assistantMsgId = `msg-${++msgCounter}`
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        parts: [],
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsLoading(true)
      setIsStreaming(true)
      setError(null)
      setScrollToMsgId(userMsg.id)
      partsRef.current = []
      toolPartByIdRef.current = new Map()
      streamingMsgIdRef.current = assistantMsgId

      bufferRef.current = ""
      if (drainRef.current) clearInterval(drainRef.current)
      drainRef.current = setInterval(() => {
        if (bufferRef.current.length === 0) return
        const len = bufferRef.current.length
        const chunkSize =
          len > 120
            ? Math.ceil(len / 2)
            : len > 40
              ? Math.ceil(len / 1.5)
              : Math.min(8, len)
        const chunk = bufferRef.current.slice(0, chunkSize)
        bufferRef.current = bufferRef.current.slice(chunkSize)

        const part = ensureTrailingTextPart()
        part.content += chunk
        syncPartsToMessage()
      }, 40)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const allMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: messageToApiContent(m),
        }))

        const response = (await chatWithDocsStream({
          data: { messages: allMessages },
          signal: controller.signal,
        })) as Response

        if (!response.ok || !response.body) {
          const text = await response.text().catch(() => "")
          let errorMsg = `Request failed with status ${response.status}`
          try {
            const parsed = JSON.parse(text)
            if (parsed.error) errorMsg = parsed.error
          } catch {
            // not JSON
          }
          throw new Error(errorMsg)
        }

        const reader = response.body.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let sseBuffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          sseBuffer += decoder.decode(value, { stream: true })
          const events = sseBuffer.split("\n\n")
          sseBuffer = events.pop() || ""

          for (const event of events) {
            const lines = event.split("\n")
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue
              const payload = line.slice(6)
              if (payload === "[DONE]") continue

              try {
                const parsed = JSON.parse(payload)
                handleSSEEvent(parsed)
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        await new Promise<void>((resolve) => {
          const check = () => {
            if (bufferRef.current.length === 0) {
              resolve()
            } else {
              setTimeout(check, 50)
            }
          }
          check()
        })
      } catch (err: unknown) {
        const isAbort =
          err instanceof Error && err.name === "AbortError"
        if (isAbort) {
          if (drainRef.current) clearInterval(drainRef.current)
          bufferRef.current = ""
          return
        }
        const message =
          err instanceof Error ? err.message : "Something went wrong"
        setError(message)
        setMessages((prev) =>
          prev.filter(
            (m) =>
              !(
                m.id === assistantMsgId &&
                (!m.parts || m.parts.length === 0)
              )
          )
        )
      } finally {
        if (drainRef.current) {
          clearInterval(drainRef.current)
          drainRef.current = null
        }
        if (bufferRef.current.length > 0) {
          flushBufferNow()
          syncPartsToMessage()
        }
        setIsLoading(false)
        setIsStreaming(false)
        streamingMsgIdRef.current = null
        abortRef.current = null
      }
    },
    [ensureTrailingTextPart, flushBufferNow, messages, syncPartsToMessage]
  )

  /**
   * Handle a parsed SSE event from the TanStack AI stream.
   * AG-UI protocol events: TEXT_MESSAGE_CONTENT, TOOL_CALL_START, TOOL_CALL_ARGS, TOOL_CALL_END
   */
  function handleSSEEvent(parsed: Record<string, unknown>) {
    switch (parsed.type) {
      case "TEXT_MESSAGE_CONTENT": {
        if (typeof parsed.delta === "string") {
          bufferRef.current += parsed.delta
        }
        break
      }

      case "TOOL_CALL_START": {
        const id = parsed.toolCallId as string
        const name = parsed.toolName as string
        if (!id || !name) break

        // Pending text must land before the tool row.
        flushBufferNow()

        const step: ToolCallStep = {
          id,
          name,
          args: "",
          status: "calling",
        }
        const toolPart: ToolPart = { type: "tool", id, step }
        partsRef.current.push(toolPart)
        toolPartByIdRef.current.set(id, toolPart)
        syncPartsToMessage()
        break
      }

      case "TOOL_CALL_ARGS": {
        const id = parsed.toolCallId as string
        const delta = parsed.delta as string
        if (!id || typeof delta !== "string") break

        const toolPart = toolPartByIdRef.current.get(id)
        if (toolPart) {
          toolPart.step.args += delta
          toolPart.step.status = "executing"
          syncPartsToMessage()
        }
        break
      }

      case "TOOL_CALL_END": {
        const id = parsed.toolCallId as string
        if (!id) break

        const toolPart = toolPartByIdRef.current.get(id)
        if (toolPart) {
          const result = parsed.result
          toolPart.step.result =
            typeof result === "string" ? result : JSON.stringify(result)
          toolPart.step.status = toolPart.step.result?.startsWith("Error")
            ? "error"
            : "completed"
          syncPartsToMessage()
        }
        break
      }
    }
  }

  const resetStreamingRefs = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    if (drainRef.current) clearInterval(drainRef.current)
    bufferRef.current = ""
    partsRef.current = []
    toolPartByIdRef.current = new Map()
    streamingMsgIdRef.current = null
  }, [])

  const handleNewConversation = useCallback(() => {
    resetStreamingRefs()
    conversationIdRef.current = history.generateId()
    setMessages([])
    setError(null)
    setIsLoading(false)
    setIsStreaming(false)
  }, [history.generateId, resetStreamingRefs])

  const handleLoadConversation = useCallback(
    (id: string) => {
      resetStreamingRefs()
      const loaded = history.loadConversation(id)
      if (loaded) {
        conversationIdRef.current = id
        setMessages(migrateMessages(loaded))
        setError(null)
        setIsLoading(false)
        setIsStreaming(false)
      }
    },
    [history.loadConversation, resetStreamingRefs]
  )

  const handleDeleteConversation = useCallback(
    (id: string) => {
      history.deleteConversation(id)
      if (conversationIdRef.current === id) {
        handleNewConversation()
      }
    },
    [history.deleteConversation, handleNewConversation]
  )

  return (
    <ChatDrawer
      onHistoryClick={() => setShowHistory((prev) => !prev)}
      onNewChat={() => {
        handleNewConversation()
        setShowHistory(false)
      }}
    >
      {showHistory && (
        <HistoryPanel
          conversations={history.conversations}
          activeConversationId={conversationIdRef.current}
          onLoadConversation={handleLoadConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onClose={() => setShowHistory(false)}
        />
      )}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        scrollToMsgId={scrollToMsgId}
      />
      {error && (
        <div className="px-4 pb-2">
          <p className="text-xs text-destructive">Error: {error}</p>
        </div>
      )}
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </ChatDrawer>
  )
}

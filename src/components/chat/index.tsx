"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChatDrawer } from "@/src/components/chat/chat-drawer"
import { ChatInput } from "@/src/components/chat/chat-input"
import { HistoryPanel } from "@/src/components/chat/history-panel"
import { MessageList } from "@/src/components/chat/message-list"
import type { ToolCallStep } from "@/src/components/chat/tool-call-display"
import { useConversationHistory } from "@/src/components/chat/use-conversation-history"
import { chatWithDocsStream } from "@/src/lib/chat-api"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  /** Tool call steps that occurred before this assistant message. */
  toolSteps?: ToolCallStep[]
}

let msgCounter = 0

export function ChatWithDocs() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [scrollToMsgId, setScrollToMsgId] = useState<string | null>(null)
  /** Live tool call steps for the current streaming response. */
  const [activeToolSteps, setActiveToolSteps] = useState<ToolCallStep[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const bufferRef = useRef("")
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null)
  /** Accumulates tool steps during streaming. */
  const toolStepsRef = useRef<Map<string, ToolCallStep>>(new Map())
  /** Tracks accumulated tool args per toolCallId */
  const toolArgsRef = useRef<Map<string, string>>(new Map())

  const history = useConversationHistory()

  // Initialize conversation ID on first mount
  useEffect(() => {
    if (!conversationIdRef.current) {
      conversationIdRef.current = history.generateId()
    }
  }, [history.generateId])

  // Persist messages to history when they change
  useEffect(() => {
    if (conversationIdRef.current && messages.length > 0 && !isStreaming) {
      history.saveConversation(conversationIdRef.current, messages)
    }
  }, [messages, isStreaming, history.saveConversation])

  // Clear scrollToMsgId after MessageList processes it
  useEffect(() => {
    if (scrollToMsgId) {
      const timer = setTimeout(() => setScrollToMsgId(null), 200)
      return () => clearTimeout(timer)
    }
  }, [scrollToMsgId])

  // Cleanup drain interval on unmount
  useEffect(() => {
    return () => {
      if (drainRef.current) clearInterval(drainRef.current)
    }
  }, [])

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
        content: "",
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsLoading(true)
      setIsStreaming(true)
      setError(null)
      setScrollToMsgId(userMsg.id)
      setActiveToolSteps([])
      toolStepsRef.current = new Map()
      toolArgsRef.current = new Map()

      // Reset buffer & start smooth drain
      bufferRef.current = ""
      if (drainRef.current) clearInterval(drainRef.current)
      drainRef.current = setInterval(() => {
        if (bufferRef.current.length === 0) return
        const len = bufferRef.current.length
        // Drain larger chunks less frequently for smoother rendering
        const chunkSize =
          len > 120
            ? Math.ceil(len / 2)
            : len > 40
              ? Math.ceil(len / 1.5)
              : Math.min(8, len)
        const chunk = bufferRef.current.slice(0, chunkSize)
        bufferRef.current = bufferRef.current.slice(chunkSize)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: m.content + chunk }
              : m
          )
        )
      }, 40)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const allMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
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
                handleSSEEvent(parsed, assistantMsgId)
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        // Wait for buffer to drain before finishing
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

        // Attach accumulated tool steps to the final assistant message
        const finalSteps = Array.from(toolStepsRef.current.values())
        if (finalSteps.length > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, toolSteps: finalSteps }
                : m
            )
          )
        }
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
            (m) => !(m.id === assistantMsgId && m.content === "")
          )
        )
      } finally {
        if (drainRef.current) {
          clearInterval(drainRef.current)
          drainRef.current = null
        }
        if (bufferRef.current.length > 0) {
          const remaining = bufferRef.current
          bufferRef.current = ""
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + remaining }
                : m
            )
          )
        }
        setIsLoading(false)
        setIsStreaming(false)
        setActiveToolSteps([])
        abortRef.current = null
      }
    },
    [messages]
  )

  /**
   * Handle a parsed SSE event from the TanStack AI stream.
   * AG-UI protocol events: TEXT_MESSAGE_CONTENT, TOOL_CALL_START, TOOL_CALL_ARGS, TOOL_CALL_END
   */
  function handleSSEEvent(parsed: Record<string, unknown>, _assistantMsgId: string) {
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

        const step: ToolCallStep = {
          id,
          name,
          args: "",
          status: "calling",
        }
        toolStepsRef.current.set(id, step)
        toolArgsRef.current.set(id, "")
        syncToolStepsToState()
        break
      }

      case "TOOL_CALL_ARGS": {
        const id = parsed.toolCallId as string
        const delta = parsed.delta as string
        if (!id || typeof delta !== "string") break

        const accumulated = (toolArgsRef.current.get(id) || "") + delta
        toolArgsRef.current.set(id, accumulated)

        const step = toolStepsRef.current.get(id)
        if (step) {
          step.args = accumulated
          step.status = "executing"
          syncToolStepsToState()
        }
        break
      }

      case "TOOL_CALL_END": {
        const id = parsed.toolCallId as string
        if (!id) break

        const step = toolStepsRef.current.get(id)
        if (step) {
          const result = parsed.result
          step.result = typeof result === "string" ? result : JSON.stringify(result)
          step.status = step.result?.startsWith("Error") ? "error" : "completed"
          syncToolStepsToState()
        }
        break
      }
    }
  }

  /** Sync the mutable tool steps ref to React state for rendering. */
  function syncToolStepsToState() {
    setActiveToolSteps(Array.from(toolStepsRef.current.values()).map((s) => ({ ...s })))
  }

  const handleNewConversation = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    if (drainRef.current) clearInterval(drainRef.current)
    bufferRef.current = ""
    toolStepsRef.current = new Map()
    toolArgsRef.current = new Map()
    conversationIdRef.current = history.generateId()
    setMessages([])
    setError(null)
    setIsLoading(false)
    setIsStreaming(false)
    setActiveToolSteps([])
  }, [history.generateId])

  const handleLoadConversation = useCallback(
    (id: string) => {
      if (abortRef.current) abortRef.current.abort()
      if (drainRef.current) clearInterval(drainRef.current)
      bufferRef.current = ""
      toolStepsRef.current = new Map()
      toolArgsRef.current = new Map()
      const loaded = history.loadConversation(id)
      if (loaded) {
        conversationIdRef.current = id
        setMessages(loaded)
        setError(null)
        setIsLoading(false)
        setIsStreaming(false)
        setActiveToolSteps([])
      }
    },
    [history.loadConversation]
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
      onHistoryClick={() => setShowHistory(true)}
      onNewChat={handleNewConversation}
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
        activeToolSteps={activeToolSteps}
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

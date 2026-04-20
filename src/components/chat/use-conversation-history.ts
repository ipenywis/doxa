import { useCallback, useEffect, useRef, useState } from "react"
import type { ChatMessage } from "@/src/components/chat"

const STORAGE_KEY = "doxa-chat-history"
const MAX_CONVERSATIONS = 5

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

function readFromStorage(): Conversation[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeToStorage(conversations: Conversation[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch {
    // localStorage full or unavailable
  }
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      setConversations(readFromStorage())
      initialized.current = true
      setHasLoaded(true)
    }
  }, [])

  const saveConversation = useCallback(
    (id: string, messages: ChatMessage[]) => {
      if (messages.length === 0) return
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === id)
        const firstUserMsg = messages.find((m) => m.role === "user")
        const firstUserText = firstUserMsg?.content ?? ""
        const title = firstUserText
          ? firstUserText.slice(0, 50) +
            (firstUserText.length > 50 ? "..." : "")
          : "New conversation"

        let updated: Conversation[]
        if (existing) {
          updated = prev.map((c) =>
            c.id === id
              ? { ...c, messages, title, updatedAt: Date.now() }
              : c
          )
        } else {
          updated = [
            {
              id,
              title,
              messages,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            ...prev,
          ]
        }

        updated.sort((a, b) => b.updatedAt - a.updatedAt)
        if (updated.length > MAX_CONVERSATIONS) {
          updated = updated.slice(0, MAX_CONVERSATIONS)
        }

        writeToStorage(updated)
        return updated
      })
    },
    []
  )

  const loadConversation = useCallback(
    (id: string): ChatMessage[] | null => {
      const conv = conversations.find((c) => c.id === id)
      return conv ? conv.messages : null
    },
    [conversations]
  )

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      writeToStorage(updated)
      return updated
    })
  }, [])

  const generateId = useCallback(() => {
    return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }, [])

  return {
    conversations,
    hasLoaded,
    saveConversation,
    loadConversation,
    deleteConversation,
    generateId,
  }
}

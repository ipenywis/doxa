import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

const EXPANDED_BREAKPOINT_PX = 1280

interface ChatContextValue {
  isOpen: boolean
  isExpanded: boolean
  setOpen: (open: boolean) => void
  toggleExpanded: () => void
  pendingQuery: string | null
  submitQuery: (query: string) => void
  consumePendingQuery: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [isExpanded, setExpanded] = useState(false)
  const [pendingQuery, setPendingQuery] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.innerWidth >= EXPANDED_BREAKPOINT_PX) setExpanded(true)
  }, [])

  const submitQuery = useCallback((query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setPendingQuery(trimmed)
    setOpen(true)
  }, [])

  const consumePendingQuery = useCallback(() => {
    setPendingQuery(null)
  }, [])

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        isExpanded,
        setOpen,
        toggleExpanded: () => setExpanded((prev) => !prev),
        pendingQuery,
        submitQuery,
        consumePendingQuery,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider")
  return ctx
}

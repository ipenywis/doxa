import { createContext, useContext, useState, type ReactNode } from "react"

interface ChatContextValue {
  isOpen: boolean
  isExpanded: boolean
  setOpen: (open: boolean) => void
  toggleExpanded: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [isExpanded, setExpanded] = useState(false)

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        isExpanded,
        setOpen,
        toggleExpanded: () => setExpanded((prev) => !prev),
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

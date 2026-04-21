import { useEffect, type ReactNode } from "react"
import {
  LuHistory,
  LuMaximize2,
  LuMinimize2,
  LuPlus,
  LuX,
} from "react-icons/lu"
import { useLocation } from "@tanstack/react-router"
import { useChatContext } from "@/src/components/chat/chat-context"

const PANEL_WIDTH = "clamp(380px, 24vw, 720px)"
const PANEL_WIDTH_EXPANDED = "clamp(520px, 34vw, 1040px)"

interface ChatDrawerProps {
  onHistoryClick: () => void
  onNewChat: () => void
  children: ReactNode
}

const btnClass =
  "cursor-pointer rounded-xs p-1 opacity-70 hover:opacity-100 focus:outline-none"

export function ChatDrawer({
  onHistoryClick,
  onNewChat,
  children,
}: ChatDrawerProps) {
  const { isOpen, isExpanded, setOpen, toggleExpanded } = useChatContext()
  const location = useLocation()
  const onDocsPage = location.pathname.startsWith("/docs")

  const panelWidth = isExpanded ? PANEL_WIDTH_EXPANDED : PANEL_WIDTH

  // Auto-close when navigating away from /docs
  useEffect(() => {
    if (!onDocsPage && isOpen) setOpen(false)
  }, [onDocsPage, isOpen, setOpen])

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, setOpen])

  return (
    <aside
      role="dialog"
      aria-label="Chat with Docs"
      className="sticky top-0 h-screen shrink-0 overflow-hidden border-l border-transparent bg-background transition-[width,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        width: isOpen ? panelWidth : "0px",
        borderColor: isOpen ? "var(--border)" : "transparent",
        maxWidth: "calc(100vw - 320px)",
      }}
    >
      <div
        className="flex h-full flex-col"
        style={{ width: panelWidth, maxWidth: "calc(100vw - 320px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <span className="font-semibold text-foreground">Chat with Docs</span>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewChat}
              className={btnClass}
              aria-label="New chat"
            >
              <LuPlus className="size-4" />
            </button>
            <button
              onClick={onHistoryClick}
              className={btnClass}
              aria-label="Chat history"
            >
              <LuHistory className="size-4" />
            </button>
            <button
              onClick={toggleExpanded}
              className={btnClass}
              aria-label={isExpanded ? "Shrink panel" : "Expand panel"}
            >
              {isExpanded ? (
                <LuMinimize2 className="size-4" />
              ) : (
                <LuMaximize2 className="size-4" />
              )}
            </button>
            <button
              onClick={() => setOpen(false)}
              className={btnClass}
              aria-label="Close chat"
            >
              <LuX className="size-5" />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="chat-drawer-scroll relative flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </aside>
  )
}

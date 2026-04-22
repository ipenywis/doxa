import { useState } from "react"
import { LuArrowUp } from "react-icons/lu"
import { useLocation } from "@tanstack/react-router"
import { useChatContext } from "@/src/components/chat/chat-context"

export function FloatingChatBar() {
  const { isOpen, requestChatInputFocus, submitQuery, setOpen } =
    useChatContext()
  const location = useLocation()
  const [value, setValue] = useState("")

  if (!location.pathname.startsWith("/docs")) return null
  if (isOpen) return null

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setOpen(true)
      requestChatInputFocus()
      return
    }
    submitQuery(trimmed)
    setValue("")
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 pr-1.5 pl-4 shadow-lg dark:border-border dark:bg-muted dark:ring-1 dark:ring-white/5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Chat with the Docs"
          aria-label="Chat with the Docs"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={handleSubmit}
          aria-label="Send message"
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90"
        >
          <LuArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

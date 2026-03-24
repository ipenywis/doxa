import { Button } from "@/src/components/ui/button"
import { LuSend } from "react-icons/lu"
import { useState } from "react"

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("")

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue("")
  }

  return (
    <div className="flex items-center gap-2 border-t p-4">
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
        placeholder="Ask about the docs..."
        disabled={isLoading}
        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={isLoading || !value.trim()}
        className="h-9 w-9 shrink-0 cursor-pointer"
        aria-label="Send message"
      >
        <LuSend className="h-4 w-4" />
      </Button>
    </div>
  )
}

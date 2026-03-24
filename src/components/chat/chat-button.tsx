import { Button } from "@/src/components/ui/button"
import { useChatContext } from "@/src/components/chat/chat-context"
import { useLocation } from "@tanstack/react-router"
import { LuMessagesSquare } from "react-icons/lu"

export function ChatButton() {
  const { setOpen } = useChatContext()
  const location = useLocation()

  if (!location.pathname.startsWith("/docs")) return null

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setOpen(true)}
      className="h-9 w-9 cursor-pointer"
      aria-label="Chat with docs"
    >
      <LuMessagesSquare className="h-[1.1rem] w-[1.1rem]" />
    </Button>
  )
}

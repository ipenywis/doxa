import { LuChevronLeft, LuPlus, LuTrash2 } from "react-icons/lu"
import { Button } from "@/src/components/ui/button"
import type { Conversation } from "@/src/components/chat/use-conversation-history"

interface HistoryPanelProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onLoadConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onClose: () => void
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`

  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  })
}

function groupByDate(
  conversations: Conversation[]
): { label: string; items: Conversation[] }[] {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups: Record<string, Conversation[]> = {}

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt)
    let label: string
    if (date.toDateString() === today.toDateString()) {
      label = "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday"
    } else {
      label = "Earlier"
    }
    if (!groups[label]) groups[label] = []
    groups[label].push(conv)
  }

  const order = ["Today", "Yesterday", "Earlier"]
  return order
    .filter((label) => groups[label])
    .map((label) => ({ label, items: groups[label] }))
}

export function HistoryPanel({
  conversations,
  activeConversationId,
  onLoadConversation,
  onNewConversation,
  onDeleteConversation,
  onClose,
}: HistoryPanelProps) {
  const grouped = groupByDate(conversations)

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-background animate-in slide-in-from-left duration-200">
      <div className="flex items-center gap-2 border-b p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0 cursor-pointer"
          aria-label="Back"
        >
          <LuChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-foreground">History</span>
      </div>

      <div className="p-3">
        <Button
          variant="outline"
          className="w-full cursor-pointer justify-start gap-2"
          onClick={() => {
            onNewConversation()
            onClose()
          }}
        >
          <LuPlus className="h-4 w-4" />
          New conversation
        </Button>
      </div>

      <div className="chat-drawer-scroll flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No conversations yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start a chat to see your history here
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted ${
                      conv.id === activeConversationId
                        ? "border-l-2 border-primary bg-muted/50"
                        : ""
                    }`}
                    onClick={() => {
                      onLoadConversation(conv.id)
                      onClose()
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {conv.messages.length} messages ·{" "}
                        {formatRelativeTime(conv.updatedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conv.id)
                      }}
                      aria-label="Delete conversation"
                    >
                      <LuTrash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

import { LuMessageSquareText } from "react-icons/lu";

import type { ChatPageContext } from "@/src/lib/chat-page-context";
import { Button } from "@/src/components/ui/button";
import { useChatContext } from "@/src/components/chat/chat-context";

interface ChatWithPageProps {
  pageContext: ChatPageContext;
}

export function ChatWithPage({ pageContext }: ChatWithPageProps) {
  const { startConversationWithPage } = useChatContext();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => startConversationWithPage(pageContext)}
      aria-label={`Chat with page ${pageContext.title}`}
      className="h-8 cursor-pointer"
    >
      <LuMessageSquareText className="size-4" />
      <span>Chat with page</span>
    </Button>
  );
}

import { useEffect, useRef, useState } from "react";
import { LuFileText, LuSend, LuX } from "react-icons/lu";

import type { ChatPageContext } from "@/src/lib/chat-page-context";
import { Button } from "@/src/components/ui/button";
import { useChatContext } from "@/src/components/chat/chat-context";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  pageContext: ChatPageContext | null;
  onRemovePageContext: () => void;
}

export function ChatInput({
  onSend,
  isLoading,
  pageContext,
  onRemovePageContext,
}: ChatInputProps) {
  const { focusRequestId, isOpen } = useChatContext();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  };

  useEffect(() => {
    if (!isOpen || isLoading) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [focusRequestId, isLoading, isOpen]);

  return (
    <div className="sticky bottom-0 z-10 flex items-end gap-2 border-t bg-background p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {pageContext && (
          <div
            className="inline-flex max-w-full items-center gap-1.5 self-start rounded-md border bg-muted/50 py-1 pr-1 pl-2 text-xs text-muted-foreground"
            title={`Attached page: ${pageContext.title}`}
          >
            <LuFileText className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">{pageContext.title}</span>
            <button
              type="button"
              onClick={onRemovePageContext}
              aria-label={`Remove attached page ${pageContext.title}`}
              className="inline-flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <LuX className="size-3.5" />
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask about the docs..."
          disabled={isLoading}
          className="min-w-0 rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>
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
  );
}

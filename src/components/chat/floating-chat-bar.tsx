import { RefObject, useRef, useState } from "react";
import { useDemoMode } from "@/src/contexts/demo-mode";
import { LuArrowUp } from "react-icons/lu";
import { useOnClickOutside } from "usehooks-ts";

import { useChatContext } from "@/src/components/chat/chat-context";

export function FloatingChatBar() {
  const { isOpen, requestChatInputFocus, submitQuery, setOpen } =
    useChatContext();
  const isDemoMode = useDemoMode();
  const [value, setValue] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside([containerRef as RefObject<HTMLElement>], () => {
    if (expanded && !value.trim()) setExpanded(false);
  });

  if (isDemoMode) return null;
  if (isOpen) return null;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setOpen(true);
      requestChatInputFocus();
      return;
    }
    submitQuery(trimmed);
    setValue("");
    setExpanded(false);
  };

  const handleExpand = () => {
    setExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div
        ref={containerRef}
        onClick={() => {
          if (!expanded) handleExpand();
        }}
        className={`pointer-events-auto flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 pr-1.5 pl-4 shadow-lg transition-[width,max-width] duration-200 ease-out sm:w-full sm:max-w-sm dark:border-border dark:bg-muted dark:ring-1 dark:ring-white/5 ${
          expanded
            ? "w-full max-w-[calc(100vw-2rem)] cursor-text"
            : "w-72 max-w-[calc(100vw-2rem)] cursor-pointer"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Chat with the Docs"
          aria-label="Chat with the Docs"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSubmit();
          }}
          aria-label="Send message"
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90"
        >
          <LuArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

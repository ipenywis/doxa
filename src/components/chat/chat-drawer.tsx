import { type ReactNode } from "react";
import {
  LuHistory,
  LuMaximize2,
  LuMinimize2,
  LuPlus,
  LuX,
} from "react-icons/lu";
import { useEventListener } from "usehooks-ts";

import { useChatContext } from "@/src/components/chat/chat-context";

const PANEL_WIDTH = "clamp(360px, 24vw, 720px)";
const PANEL_WIDTH_EXPANDED = "clamp(520px, 34vw, 1040px)";
const PANEL_MAX_WIDTH = "calc(100vw - 240px)";

interface ChatDrawerProps {
  onHistoryClick: () => void;
  onNewChat: () => void;
  children: ReactNode;
}

const btnClass =
  "cursor-pointer rounded-xs p-1 opacity-70 hover:opacity-100 focus:outline-none";

export function ChatDrawer({
  onHistoryClick,
  onNewChat,
  children,
}: ChatDrawerProps) {
  const { isOpen, isExpanded, isMobile, setOpen, toggleExpanded } =
    useChatContext();

  const panelWidth = isExpanded ? PANEL_WIDTH_EXPANDED : PANEL_WIDTH;

  useEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) setOpen(false);
  });

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Chat with Docs"
          className="fixed inset-0 z-50 flex flex-col bg-background transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: isOpen ? "translateY(0)" : "translateY(100%)",
            pointerEvents: isOpen ? "auto" : "none",
          }}
        >
          <div className="flex items-center justify-between border-b p-4">
            <span className="font-semibold text-foreground">
              Chat with Docs
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={onNewChat}
                className={btnClass}
                aria-label="New chat"
              >
                <LuPlus className="size-5" />
              </button>
              <button
                onClick={onHistoryClick}
                className={btnClass}
                aria-label="Chat history"
              >
                <LuHistory className="size-5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className={btnClass}
                aria-label="Close chat"
              >
                <LuX className="size-6" />
              </button>
            </div>
          </div>
          <div className="chat-drawer-scroll relative flex flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </aside>
      </>
    );
  }

  return (
    <aside
      role="dialog"
      aria-label="Chat with Docs"
      className="sticky top-0 h-screen shrink-0 overflow-hidden border-l border-transparent bg-background transition-[width,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        width: isOpen ? panelWidth : "0px",
        borderColor: isOpen ? "var(--border)" : "transparent",
        maxWidth: PANEL_MAX_WIDTH,
      }}
    >
      <div
        className="flex h-full flex-col"
        style={{ width: panelWidth, maxWidth: PANEL_MAX_WIDTH }}
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
  );
}

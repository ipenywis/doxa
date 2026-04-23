import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "@tanstack/react-router";

import type { ChatPageContext } from "@/src/lib/chat-page-context";

const EXPANDED_BREAKPOINT_PX = 1280;

interface ChatContextValue {
  isOpen: boolean;
  isExpanded: boolean;
  currentPageContext: ChatPageContext | null;
  attachedPageContext: ChatPageContext | null;
  pendingPageConversationContext: ChatPageContext | null;
  focusRequestId: number;
  setOpen: (open: boolean) => void;
  toggleExpanded: () => void;
  setCurrentPageContext: (context: ChatPageContext | null) => void;
  setAttachedPageContext: (context: ChatPageContext | null) => void;
  attachPageContext: (context: ChatPageContext) => void;
  attachCurrentPageToChat: () => void;
  removeAttachedPageContext: () => void;
  startConversationWithPage: (context: ChatPageContext) => void;
  consumePendingPageConversation: () => void;
  requestChatInputFocus: () => void;
  pendingQuery: string | null;
  submitQuery: (query: string) => void;
  consumePendingQuery: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isOpen, setOpen] = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  const [currentPageContext, setCurrentPageContextState] =
    useState<ChatPageContext | null>(null);
  const [attachedPageContext, setAttachedPageContextState] =
    useState<ChatPageContext | null>(null);
  const [pendingPageConversationContext, setPendingPageConversationContext] =
    useState<ChatPageContext | null>(null);
  const [focusRequestId, setFocusRequestId] = useState(0);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= EXPANDED_BREAKPOINT_PX) setExpanded(true);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/docs")) return;
    setCurrentPageContextState(null);
    setAttachedPageContextState(null);
    setPendingPageConversationContext(null);
  }, [location.pathname]);

  const requestChatInputFocus = useCallback(() => {
    setFocusRequestId((id) => id + 1);
  }, []);

  const submitQuery = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      if (currentPageContext) setAttachedPageContextState(currentPageContext);
      setPendingQuery(trimmed);
      setOpen(true);
      requestChatInputFocus();
    },
    [currentPageContext, requestChatInputFocus]
  );

  const setCurrentPageContext = useCallback(
    (context: ChatPageContext | null) => {
      setCurrentPageContextState(context);
      if (!context) setAttachedPageContextState(null);
    },
    []
  );

  const setAttachedPageContext = useCallback(
    (context: ChatPageContext | null) => {
      setAttachedPageContextState(context);
    },
    []
  );

  const attachPageContext = useCallback(
    (context: ChatPageContext) => {
      setAttachedPageContextState(context);
      setOpen(true);
      requestChatInputFocus();
    },
    [requestChatInputFocus]
  );

  const startConversationWithPage = useCallback(
    (context: ChatPageContext) => {
      setPendingPageConversationContext(context);
      setOpen(true);
      requestChatInputFocus();
    },
    [requestChatInputFocus]
  );

  const consumePendingPageConversation = useCallback(() => {
    setPendingPageConversationContext(null);
  }, []);

  const attachCurrentPageToChat = useCallback(() => {
    if (!currentPageContext) return;
    attachPageContext(currentPageContext);
  }, [attachPageContext, currentPageContext]);

  const removeAttachedPageContext = useCallback(() => {
    setAttachedPageContextState(null);
  }, []);

  const consumePendingQuery = useCallback(() => {
    setPendingQuery(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        isExpanded,
        currentPageContext,
        attachedPageContext,
        pendingPageConversationContext,
        focusRequestId,
        setOpen,
        toggleExpanded: () => setExpanded((prev) => !prev),
        setCurrentPageContext,
        setAttachedPageContext,
        attachPageContext,
        attachCurrentPageToChat,
        removeAttachedPageContext,
        startConversationWithPage,
        consumePendingPageConversation,
        requestChatInputFocus,
        pendingQuery,
        submitQuery,
        consumePendingQuery,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}

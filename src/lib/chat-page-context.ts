export interface ChatPageContext {
  slug: string;
  href: string;
  sourcePath: string;
  title: string;
  description?: string;
}

export interface ChatRequestMessage {
  role: "user" | "assistant";
  content: string;
  pageContext?: ChatPageContext;
}

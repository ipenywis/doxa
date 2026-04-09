import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ChatDrawer } from "@/src/components/chat/chat-drawer"
import { LuSend } from "react-icons/lu"

const DEMO_USER_MESSAGE = "How do I get started with the documentation?"

const DEMO_AI_RESPONSE = `Great question! Here's how to get started:

1. **Install dependencies** — Run \`pnpm install\` to set up the project
2. **Start the dev server** — Run \`pnpm dev\` to launch the local development server
3. **Add your content** — Create MDX files in the \`src/contents/docs/\` directory

Each documentation page uses **MDX** format with YAML frontmatter for metadata. You can use built-in components like \`<Note>\`, \`<Card>\`, and \`<Step>\` to create rich, interactive documentation.

Check out the [Getting Started](/docs/getting-started) guide for a full walkthrough.`

const markdownComponents = {
  a: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({
    children,
    className,
  }: {
    children?: React.ReactNode
    className?: string
  }) => {
    if (className?.startsWith("language-")) {
      return (
        <code className={`block text-xs leading-relaxed ${className}`}>
          {children}
        </code>
      )
    }
    return (
      <code className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.8125em] font-medium text-primary before:content-none after:content-none">
        {children}
      </code>
    )
  },
}

export function DemoChatWithDocs() {
  return (
    <ChatDrawer onHistoryClick={() => {}} onNewChat={() => {}}>
      {/* Example messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-3 p-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
              {DEMO_USER_MESSAGE}
            </div>
          </div>
          {/* AI response */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm">
              <div className="chat-prose prose prose-sm dark:prose-invert prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-1.5 prose-a:text-primary prose-strong:text-foreground prose-strong:font-semibold prose-code:text-primary prose-pre:bg-transparent prose-pre:p-0 prose-li:text-foreground/90 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 max-w-none">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {DEMO_AI_RESPONSE}
                </Markdown>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Disabled input */}
      <div className="flex items-center gap-2 border-t p-4 opacity-50">
        <input
          type="text"
          placeholder="Ask about the docs..."
          disabled
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          disabled
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <LuSend className="h-4 w-4" />
        </button>
      </div>
    </ChatDrawer>
  )
}

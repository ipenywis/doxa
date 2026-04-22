import { chat, toServerSentEventsResponse, type AnyTextAdapter, type ModelMessage } from "@tanstack/ai"
import { createAnthropicChat } from "@tanstack/ai-anthropic"
import { createGrokText } from "@tanstack/ai-grok"
import { createOpenaiChat } from "@tanstack/ai-openai"
import { createOpenRouterText } from "@tanstack/ai-openrouter"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { agentTools } from "@/src/lib/agent/tools"
import { buildAgentSystemPrompt } from "@/src/lib/agent/system-prompt"
import type {
  ChatPageContext,
  ChatRequestMessage,
} from "@/src/lib/chat-page-context"
import { contentStore } from "@/src/lib/content/store"
import { PageRoutes } from "@/src/lib/pageroutes"
import { aiConfig } from "@/src/settings/ai"
import { Settings } from "@/src/settings/main"

const chatPageContextSchema = z.object({
  slug: z.string().min(1),
  href: z.string().min(1),
  sourcePath: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
})

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      pageContext: chatPageContextSchema.optional().catch(undefined),
    })
  ),
})

function getAdapter(apiKey: string): AnyTextAdapter {
  switch (aiConfig.provider) {
    case "openai":
      return createOpenaiChat(aiConfig.model, apiKey)
    case "openrouter":
      return createOpenRouterText(aiConfig.model, apiKey)
    case "grok":
      return createGrokText(aiConfig.model, apiKey)
    case "anthropic":
      return createAnthropicChat(aiConfig.model, apiKey)
  }
}

function routeTitleForSlug(slug: string): string | null {
  return PageRoutes.find((route) => route.href === slug)?.title ?? null
}

async function resolvePageContext(
  context: ChatPageContext | undefined
): Promise<ChatPageContext | null> {
  if (!context) return null

  const entryFromSlug = await contentStore.getEntry(context.slug)
  const entryFromSource = await contentStore.getEntry(context.sourcePath)
  if (!entryFromSlug || !entryFromSource) return null
  if (entryFromSlug.filePath !== entryFromSource.filePath) return null

  const title =
    routeTitleForSlug(entryFromSlug.slug) || entryFromSlug.frontmatter.title

  return {
    slug: entryFromSlug.slug.replace(/^\//, ""),
    href: `/docs${entryFromSlug.slug}`,
    sourcePath: entryFromSlug.filePath,
    title: title || context.title,
    ...(entryFromSlug.frontmatter.description
      ? { description: entryFromSlug.frontmatter.description }
      : {}),
  }
}

function pageContextCacheKey(context: ChatPageContext): string {
  return `${context.slug}\u0000${context.sourcePath}`
}

async function resolveMessagePageContexts(
  messages: ChatRequestMessage[]
): Promise<(ChatPageContext | null)[]> {
  const cache = new Map<string, Promise<ChatPageContext | null>>()

  return Promise.all(
    messages.map((message) => {
      if (message.role !== "user" || !message.pageContext) {
        return Promise.resolve(null)
      }

      const key = pageContextCacheKey(message.pageContext)
      const cached = cache.get(key)
      if (cached) return cached

      const resolved = resolvePageContext(message.pageContext)
      cache.set(key, resolved)
      return resolved
    })
  )
}

function getLatestUserPageContext(
  messages: ChatRequestMessage[],
  pageContexts: (ChatPageContext | null)[]
): ChatPageContext | null {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === "user") {
      return pageContexts[index] ?? null
    }
  }

  return null
}

function formatUserContentForModel(
  content: string,
  pageContext: ChatPageContext | null
): string {
  if (!pageContext) return content

  const contextLines = [
    "Attached page context for this user message:",
    `- Title: ${pageContext.title}`,
    `- URL: ${pageContext.href}`,
    `- Source file: ${pageContext.sourcePath}`,
  ]

  if (pageContext.description) {
    contextLines.push(`- Description: ${pageContext.description}`)
  }

  return `${contextLines.join("\n")}\n\nUser message:\n${content}`
}

export const chatWithDocsStream = createServerFn({ method: "POST" })
  .inputValidator((data) => chatRequestSchema.parse(data))
  .handler(async ({ data }): Promise<Response> => {
    console.log("[chat-api-stream] Handler invoked, messages:", data.messages.length)
    if (!Settings.features.ai.chat) {
      return new Response(
        JSON.stringify({ error: "Chat with Docs is disabled." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    const apiKey = process.env.AI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI_API_KEY environment variable is not set." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const { messages } = data

    if (messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many messages." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    try {
      const pageContexts = await resolveMessagePageContexts(messages)
      const currentPageContext = getLatestUserPageContext(messages, pageContexts)
      const systemPrompt = await buildAgentSystemPrompt(currentPageContext)
      const adapter = getAdapter(apiKey)
      const abortController = new AbortController()

      const modelMessages: ModelMessage[] = messages.map((m, index) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content:
          m.role === "user"
            ? formatUserContentForModel(m.content, pageContexts[index])
            : m.content,
      }))

      // OpenRouter: sort providers by throughput (fastest first) and allow
      // parallel tool calls so the model can batch multiple reads in one turn.
      const modelOptions =
        aiConfig.provider === "openrouter"
          ? {
              provider: {
                sort: "throughput" as const,
                allow_fallbacks: true,
              },
              parallelToolCalls: true,
            }
          : undefined

      const stream = chat({
        adapter,
        systemPrompts: [systemPrompt],
        messages: modelMessages,
        tools: agentTools,
        maxTokens: aiConfig.maxResponseTokens,
        stream: true as const,
        agentLoopStrategy: ({ iterationCount }) => iterationCount < 5,
        ...(modelOptions ? { modelOptions } : {}),
      } as Parameters<typeof chat>[0])

      return toServerSentEventsResponse(stream, { abortController })
    } catch (err: unknown) {
      console.error("Chat API stream error:", err)
      const message =
        err instanceof Error
          ? err.message
          : "Failed to get a response from the AI provider."
      return new Response(
        JSON.stringify({
          error: message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  })

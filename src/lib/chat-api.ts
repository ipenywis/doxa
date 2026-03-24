import { chat, toServerSentEventsResponse, type AnyTextAdapter, type ModelMessage } from "@tanstack/ai"
import { createAnthropicChat } from "@tanstack/ai-anthropic"
import { createGrokText } from "@tanstack/ai-grok"
import { createOpenaiChat } from "@tanstack/ai-openai"
import { createOpenRouterText } from "@tanstack/ai-openrouter"
import { createServerFn } from "@tanstack/react-start"

import { ensureIndex, searchDocs } from "@/src/lib/doc-index"
import { aiConfig } from "@/src/settings/ai"
import { sitename } from "@/src/settings/main"

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

function buildSystemPrompt(contextSections: string): string {
  return `You are a documentation assistant for ${sitename}.
Answer using ONLY the provided documentation context below.
When referencing a doc section, use the exact Link from that section's context block (e.g. [Section Title](/docs/basic-setup/installation#prerequisites)).
All doc links start with /docs/.
${aiConfig.codeSnippets ? "Include code snippets when helpful." : "Do not include code snippets."}
If the question is outside the scope of the documentation, say so and suggest checking the docs directly.

DOCUMENTATION CONTEXT:
${contextSections}`
}

async function prepareContext(
  messages: { role: string; content: string }[]
): Promise<{ contextSections: string; modelMessages: ModelMessage[] }> {
  const lastUserMsg = [...messages]
    .reverse()
    .find((m) => m.role === "user")
  const query = lastUserMsg?.content || ""

  await ensureIndex()
  const chunks = searchDocs(query, aiConfig.maxContextChunks)
  console.log(`[chat-api] Query: "${query}" → ${chunks.length} chunks found`)

  const contextSections = chunks
    .map((chunk, i) => {
      const url = `/docs${chunk.docPath}`
      const fullUrl = chunk.sectionAnchor ? `${url}${chunk.sectionAnchor}` : url
      return `--- Document ${i + 1}: "${chunk.docTitle}" ---\nURL: ${url}\nSection: ${chunk.sectionTitle}\nLink: [${chunk.sectionTitle}](${fullUrl})\nContent:\n${chunk.content}`
    })
    .join("\n\n")

  const modelMessages: ModelMessage[] = messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }))

  return { contextSections, modelMessages }
}

export const chatWithDocs = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { messages: { role: "user" | "assistant"; content: string }[] }) => data
  )
  .handler(async ({ data }): Promise<{ content: string; error?: string }> => {
    console.log("[chat-api] Handler invoked, messages:", data.messages.length)
    const apiKey = process.env.AI_API_KEY
    if (!apiKey) {
      return { content: "", error: "AI_API_KEY environment variable is not set." }
    }

    const { messages } = data

    if (messages.length > 50) {
      return { content: "", error: "Too many messages." }
    }

    try {
      const { contextSections, modelMessages } = await prepareContext(messages)
      const systemPrompt = buildSystemPrompt(contextSections)
      const adapter = getAdapter(apiKey)

      const result = await chat({
        adapter,
        systemPrompts: [systemPrompt],
        messages: modelMessages,
        maxTokens: aiConfig.maxResponseTokens,
        stream: false as const,
      })

      return { content: result }
    } catch (err: unknown) {
      console.error("Chat API error:", err)
      const message =
        err instanceof Error
          ? err.message
          : "Failed to get a response from the AI provider."
      return {
        content: "",
        error: message,
      }
    }
  })

export const chatWithDocsStream = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { messages: { role: "user" | "assistant"; content: string }[] }) => data
  )
  .handler(async ({ data }): Promise<Response> => {
    console.log("[chat-api-stream] Handler invoked, messages:", data.messages.length)
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
      const { contextSections, modelMessages } = await prepareContext(messages)
      const systemPrompt = buildSystemPrompt(contextSections)
      const adapter = getAdapter(apiKey)
      const abortController = new AbortController()

      const stream = chat({
        adapter,
        systemPrompts: [systemPrompt],
        messages: modelMessages,
        maxTokens: aiConfig.maxResponseTokens,
        stream: true as const,
      })

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

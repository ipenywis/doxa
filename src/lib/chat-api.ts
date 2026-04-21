import { chat, toServerSentEventsResponse, type AnyTextAdapter, type ModelMessage } from "@tanstack/ai"
import { createAnthropicChat } from "@tanstack/ai-anthropic"
import { createGrokText } from "@tanstack/ai-grok"
import { createOpenaiChat } from "@tanstack/ai-openai"
import { createOpenRouterText } from "@tanstack/ai-openrouter"
import { createServerFn } from "@tanstack/react-start"

import { agentTools } from "@/src/lib/agent/tools"
import { buildAgentSystemPrompt } from "@/src/lib/agent/system-prompt"
import { aiConfig } from "@/src/settings/ai"

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
      const systemPrompt = await buildAgentSystemPrompt()
      const adapter = getAdapter(apiKey)
      const abortController = new AbortController()

      const modelMessages: ModelMessage[] = messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
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

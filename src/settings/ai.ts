import { createAnthropicChat } from "@tanstack/ai-anthropic"
import { createGrokText } from "@tanstack/ai-grok"
import { createOpenaiChat } from "@tanstack/ai-openai"
import { createOpenRouterText } from "@tanstack/ai-openrouter"

export type AIProvider = "anthropic" | "openai" | "openrouter" | "grok"

type OpenAIModelId = Parameters<typeof createOpenaiChat>[0]
type OpenRouterModelId = Parameters<typeof createOpenRouterText>[0]
type GrokModelId = Parameters<typeof createGrokText>[0]
type AnthropicModelId = Parameters<typeof createAnthropicChat>[0]

interface AiConfigShared {
  codeSnippets: boolean
  maxContextChunks: number
  maxResponseTokens: number
}

export type AiConfig =
  | (AiConfigShared & { provider: "openai"; model: OpenAIModelId })
  | (AiConfigShared & { provider: "openrouter"; model: OpenRouterModelId })
  | (AiConfigShared & { provider: "grok"; model: GrokModelId })
  | (AiConfigShared & { provider: "anthropic"; model: AnthropicModelId })

export const aiConfig: AiConfig = {
  provider: "openrouter",
  /** Cast when using a model id not yet in the SDK list */
  model: "moonshotai/kimi-k2.5" as OpenRouterModelId,
  codeSnippets: true,
  maxContextChunks: 12,
  maxResponseTokens: 2048,
}

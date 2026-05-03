import {
  chat,
  toServerSentEventsResponse,
  type AnyTextAdapter,
  type ModelMessage,
  type StreamChunk,
} from "@tanstack/ai";
import { createAnthropicChat } from "@tanstack/ai-anthropic";
import { createGrokText } from "@tanstack/ai-grok";
import { createOpenaiChat } from "@tanstack/ai-openai";
import { createOpenRouterText } from "@tanstack/ai-openrouter";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { aiConfig } from "@/src/settings/ai";
import { Settings } from "@/src/settings/main";
import { createDocsAnswerGuard } from "@/src/lib/agent/answer-guard";
import { buildAgentSystemPrompt } from "@/src/lib/agent/system-prompt";
import { agentTools } from "@/src/lib/agent/tools";
import type {
  ChatPageContext,
  ChatRequestMessage,
} from "@/src/lib/chat-page-context";
import { contentStore } from "@/src/lib/content/store";
import { PageRoutes } from "@/src/lib/pageroutes";

const chatPageContextSchema = z.object({
  slug: z.string().min(1),
  href: z.string().min(1),
  sourcePath: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      pageContext: chatPageContextSchema.optional().catch(undefined),
    })
  ),
});

function getAdapter(apiKey: string): AnyTextAdapter {
  switch (aiConfig.provider) {
    case "openai":
      return createOpenaiChat(aiConfig.model, apiKey);
    case "openrouter":
      return createOpenRouterText(aiConfig.model, apiKey);
    case "grok":
      return createGrokText(aiConfig.model, apiKey);
    case "anthropic":
      return createAnthropicChat(aiConfig.model, apiKey);
  }
}

function routeTitleForSlug(slug: string): string | null {
  return PageRoutes.find((route) => route.href === slug)?.title ?? null;
}

async function resolvePageContext(
  context: ChatPageContext | undefined
): Promise<ChatPageContext | null> {
  if (!context) return null;

  const entryFromSlug = await contentStore.getEntry(context.slug);
  const entryFromSource = await contentStore.getEntry(context.sourcePath);
  if (!entryFromSlug || !entryFromSource) return null;
  if (entryFromSlug.filePath !== entryFromSource.filePath) return null;

  const title =
    routeTitleForSlug(entryFromSlug.slug) || entryFromSlug.frontmatter.title;

  return {
    slug: entryFromSlug.slug.replace(/^\//, ""),
    href: entryFromSlug.slug,
    sourcePath: entryFromSlug.filePath,
    title: title || context.title,
    ...(entryFromSlug.frontmatter.description
      ? { description: entryFromSlug.frontmatter.description }
      : {}),
  };
}

function pageContextCacheKey(context: ChatPageContext): string {
  return `${context.slug}\u0000${context.sourcePath}`;
}

async function resolveMessagePageContexts(
  messages: ChatRequestMessage[]
): Promise<(ChatPageContext | null)[]> {
  const cache = new Map<string, Promise<ChatPageContext | null>>();

  return Promise.all(
    messages.map((message) => {
      if (message.role !== "user" || !message.pageContext) {
        return Promise.resolve(null);
      }

      const key = pageContextCacheKey(message.pageContext);
      const cached = cache.get(key);
      if (cached) return cached;

      const resolved = resolvePageContext(message.pageContext);
      cache.set(key, resolved);
      return resolved;
    })
  );
}

function getLatestUserPageContext(
  messages: ChatRequestMessage[],
  pageContexts: (ChatPageContext | null)[]
): ChatPageContext | null {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === "user") {
      return pageContexts[index] ?? null;
    }
  }

  return null;
}

function describeError(err: unknown): {
  message: string;
  stack?: string;
  extras: Record<string, unknown>;
} {
  if (err instanceof Error) {
    const extras: Record<string, unknown> = {};
    for (const key of Object.keys(err) as (keyof Error)[]) {
      extras[key as string] = (err as unknown as Record<string, unknown>)[
        key as string
      ];
    }
    const cause = (err as { cause?: unknown }).cause;
    if (cause !== undefined) extras.cause = cause;
    return {
      message: err.message || err.name || "Unknown error",
      stack: err.stack,
      extras,
    };
  }
  return { message: String(err), extras: {} };
}

/**
 * Wrap the upstream chat stream so any error (thrown during iteration OR
 * yielded as a `RUN_ERROR` chunk by the adapter) is logged to the terminal
 * with full stack and provider context. Thrown errors are re-thrown so
 * `toServerSentEventsResponse` still emits an AG-UI `RUN_ERROR` SSE event
 * for the client to surface.
 */
async function* logStreamErrors(
  stream: AsyncIterable<StreamChunk>,
  context: { provider: string; model: string }
): AsyncIterable<StreamChunk> {
  try {
    for await (const chunk of stream) {
      if (chunk.type === "RUN_ERROR") {
        console.error("[chat-api-stream] AI provider emitted RUN_ERROR", {
          provider: context.provider,
          model: context.model,
          error: chunk.error,
        });
      }
      yield chunk;
    }
  } catch (err: unknown) {
    const detail = describeError(err);
    console.error(
      "[chat-api-stream] Stream iteration threw — provider:",
      context.provider,
      "model:",
      context.model,
      "\nMessage:",
      detail.message,
      "\nExtras:",
      detail.extras,
      "\nStack:",
      detail.stack ?? "(no stack)"
    );
    throw err;
  }
}

function formatUserContentForModel(
  content: string,
  pageContext: ChatPageContext | null
): string {
  if (!pageContext) return content;

  const contextLines = [
    "Attached page context for this user message:",
    `- Title: ${pageContext.title}`,
    `- URL: ${pageContext.href}`,
    `- Source file: ${pageContext.sourcePath}`,
  ];

  if (pageContext.description) {
    contextLines.push(`- Description: ${pageContext.description}`);
  }

  return `${contextLines.join("\n")}\n\nUser message:\n${content}`;
}

export const chatWithDocsStream = createServerFn({ method: "POST" })
  .inputValidator((data) => chatRequestSchema.parse(data))
  .handler(async ({ data }): Promise<Response> => {
    console.log(
      "[chat-api-stream] Handler invoked, messages:",
      data.messages.length
    );
    if (!Settings.features.ai.chat) {
      return new Response(
        JSON.stringify({ error: "Chat with Docs is disabled." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "AI_API_KEY environment variable is not set.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = data;

    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const pageContexts = await resolveMessagePageContexts(messages);
      const currentPageContext = getLatestUserPageContext(
        messages,
        pageContexts
      );
      const systemPrompt = await buildAgentSystemPrompt(currentPageContext);
      const adapter = getAdapter(apiKey);
      const abortController = new AbortController();
      const answerGuard = createDocsAnswerGuard();

      const modelMessages: ModelMessage[] = messages.map((m, index) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content:
          m.role === "user"
            ? formatUserContentForModel(m.content, pageContexts[index])
            : m.content,
      }));

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
          : undefined;

      const stream = chat({
        adapter,
        systemPrompts: [systemPrompt],
        messages: modelMessages,
        tools: agentTools,
        middleware: [answerGuard.middleware],
        maxTokens: aiConfig.maxResponseTokens,
        stream: true as const,
        agentLoopStrategy: ({ iterationCount }) =>
          answerGuard.shouldContinue(iterationCount),
        ...(modelOptions ? { modelOptions } : {}),
      } as Parameters<typeof chat>[0]);

      const loggedStream = logStreamErrors(answerGuard.wrapStream(stream), {
        provider: aiConfig.provider,
        model: String(aiConfig.model),
      });

      return toServerSentEventsResponse(loggedStream, {
        abortController,
      });
    } catch (err: unknown) {
      const detail = describeError(err);
      console.error(
        "[chat-api-stream] Setup failed before stream started — provider:",
        aiConfig.provider,
        "model:",
        String(aiConfig.model),
        "\nMessage:",
        detail.message,
        "\nExtras:",
        detail.extras,
        "\nStack:",
        detail.stack ?? "(no stack)"
      );
      return new Response(
        JSON.stringify({
          error:
            "The AI assistant is unavailable right now. Please try again in a moment.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });

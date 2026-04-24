import type { ChatMiddleware, StreamChunk, ToolCall } from "@tanstack/ai";

import {
  SUBMIT_ANSWER_TOOL_NAME,
  submitAnswerInputSchema,
  type DocsAnswerCitation,
  type DocsAnswerScope,
  type SubmitAnswerInput,
} from "@/src/lib/agent/tools/submit-answer";
import { contentStore } from "@/src/lib/content/store";

const UNSUPPORTED_DOCS_RESPONSE =
  "I can only answer from the Doxa documentation. I couldn't find support for that in the current docs.";

const MAX_AGENT_ITERATIONS = 5;

interface ValidatedCitation extends DocsAnswerCitation {
  filePath: string;
}

interface AcceptedDocsAnswer {
  scope: DocsAnswerScope;
  text: string;
  citations: ValidatedCitation[];
}

interface ValidationResult {
  ok: boolean;
  message: string;
}

export interface DocsAnswerGuard {
  middleware: ChatMiddleware;
  shouldContinue: (iterationCount: number) => boolean;
  wrapStream: (
    stream: AsyncIterable<StreamChunk>
  ) => AsyncIterable<StreamChunk>;
}

function parseToolCallArguments(toolCall: ToolCall): unknown {
  const raw = toolCall.function.arguments.trim() || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function resultToString(result: unknown): string | null {
  return typeof result === "string" ? result : null;
}

function extractGrepEvidencePaths(result: string): string[] {
  const paths = new Set<string>();

  for (const line of result.split("\n")) {
    const match = /^([^:\n]+\.mdx):\d+:/.exec(line);
    if (match) paths.add(match[1]);
  }

  return Array.from(paths);
}

function stripDocsPrefix(href: string): string | null {
  const [path] = href.split("#");
  if (!path.startsWith("/docs/")) return null;
  if (path.includes("?")) return null;
  return path.slice("/docs".length);
}

function markdownLink(title: string, href: string): string {
  return `[${title.replace(/\]/g, "\\]")}](${href})`;
}

function formatAnswer(
  input: SubmitAnswerInput,
  citations: ValidatedCitation[]
) {
  if (input.scope === "unsupported") return UNSUPPORTED_DOCS_RESPONSE;

  const sections = [input.answer.trim()];

  if (input.scope === "partial" && input.unsupportedReason?.trim()) {
    sections.push(`Not covered in the docs: ${input.unsupportedReason.trim()}`);
  }

  const sources = citations
    .map((citation) => markdownLink(citation.title, citation.href))
    .join(", ");
  sections.push(`Sources: ${sources}`);

  return sections.join("\n\n");
}

function createTextChunks(text: string, source: StreamChunk): StreamChunk[] {
  const messageId =
    source.type === "TOOL_CALL_END"
      ? `docs-answer-${source.toolCallId}`
      : `docs-answer-${source.timestamp}`;

  return [
    {
      type: "TEXT_MESSAGE_START",
      messageId,
      role: "assistant",
      model: source.model,
      timestamp: Date.now(),
    },
    {
      type: "TEXT_MESSAGE_CONTENT",
      messageId,
      delta: text,
      content: text,
      model: source.model,
      timestamp: Date.now(),
    },
    {
      type: "TEXT_MESSAGE_END",
      messageId,
      model: source.model,
      timestamp: Date.now(),
    },
  ];
}

export function createDocsAnswerGuard(): DocsAnswerGuard {
  const evidenceFilePaths = new Set<string>();
  let acceptedAnswer: AcceptedDocsAnswer | null = null;

  async function addEvidencePath(input: string): Promise<void> {
    const entry = await contentStore.getEntry(input);
    if (entry) evidenceFilePaths.add(entry.filePath);
  }

  async function addGrepEvidence(result: string): Promise<void> {
    await Promise.all(extractGrepEvidencePaths(result).map(addEvidencePath));
  }

  async function addCatEvidence(toolCall: ToolCall, result: string) {
    if (result.startsWith("Error:")) return;

    const args = parseToolCallArguments(toolCall);
    if (
      typeof args === "object" &&
      args !== null &&
      "file" in args &&
      typeof args.file === "string"
    ) {
      await addEvidencePath(args.file);
    }
  }

  async function validateCitations(
    citations: DocsAnswerCitation[]
  ): Promise<ValidationResult & { citations?: ValidatedCitation[] }> {
    const validated = new Map<string, ValidatedCitation>();

    for (const citation of citations) {
      const slug = stripDocsPrefix(citation.href);
      if (!slug) {
        return {
          ok: false,
          message: `Citation must use a /docs/... href: ${citation.href}`,
        };
      }

      const entry = await contentStore.getEntry(slug);
      if (!entry) {
        return {
          ok: false,
          message: `Citation does not resolve to a known docs page: ${citation.href}`,
        };
      }

      if (!evidenceFilePaths.has(entry.filePath)) {
        return {
          ok: false,
          message: `Citation was not supported by grep or cat evidence in this turn: ${citation.href}`,
        };
      }

      validated.set(citation.href, {
        title: entry.frontmatter.title || citation.title,
        href: citation.href,
        filePath: entry.filePath,
      });
    }

    return {
      ok: true,
      message: "Accepted.",
      citations: Array.from(validated.values()),
    };
  }

  async function validateSubmitAnswer(input: SubmitAnswerInput) {
    if (input.scope === "unsupported") {
      acceptedAnswer = {
        scope: input.scope,
        text: UNSUPPORTED_DOCS_RESPONSE,
        citations: [],
      };
      return { ok: true, message: "Accepted unsupported response." };
    }

    if (!input.answer.trim()) {
      return {
        ok: false,
        message:
          "Supported and partial answers must include non-empty answer text.",
      };
    }

    if (input.citations.length === 0) {
      return {
        ok: false,
        message: "Supported and partial answers require at least one citation.",
      };
    }

    if (input.scope === "partial" && !input.unsupportedReason?.trim()) {
      return {
        ok: false,
        message: "Partial answers require unsupportedReason.",
      };
    }

    const citationResult = await validateCitations(input.citations);
    if (!citationResult.ok || !citationResult.citations) {
      return citationResult;
    }

    acceptedAnswer = {
      scope: input.scope,
      text: formatAnswer(input, citationResult.citations),
      citations: citationResult.citations,
    };

    return { ok: true, message: "Accepted final answer." };
  }

  const middleware: ChatMiddleware = {
    name: "docs-answer-guard",
    onBeforeToolCall: async (_ctx, hookCtx) => {
      if (hookCtx.toolName !== SUBMIT_ANSWER_TOOL_NAME) return undefined;

      const parsed = submitAnswerInputSchema.safeParse(hookCtx.args);
      if (!parsed.success) {
        return {
          type: "skip",
          result:
            "Error: submit_answer input did not match the required schema. Call submit_answer again with scope, answer, citations, and unsupportedReason when needed.",
        };
      }

      const result = await validateSubmitAnswer(parsed.data);
      return {
        type: "skip",
        result: result.ok
          ? result.message
          : `Error: ${result.message} Call submit_answer again with only documentation-supported content.`,
      };
    },
    onAfterToolCall: async (_ctx, info) => {
      if (!info.ok) return;

      const result = resultToString(info.result);
      if (!result) return;

      if (info.toolName === "grep") {
        await addGrepEvidence(result);
        return;
      }

      if (info.toolName === "cat") {
        await addCatEvidence(info.toolCall, result);
      }
    },
  };

  async function* wrapStream(stream: AsyncIterable<StreamChunk>) {
    let emittedFinalAnswer = false;
    let sawRunError = false;
    let lastChunk: StreamChunk | null = null;
    const hiddenToolCallIds = new Set<string>();

    for await (const chunk of stream) {
      lastChunk = chunk;

      if (chunk.type === "RUN_ERROR") {
        sawRunError = true;
        yield chunk;
        continue;
      }

      if (
        chunk.type === "TEXT_MESSAGE_START" ||
        chunk.type === "TEXT_MESSAGE_CONTENT" ||
        chunk.type === "TEXT_MESSAGE_END"
      ) {
        continue;
      }

      if (
        chunk.type === "TOOL_CALL_START" &&
        chunk.toolName === SUBMIT_ANSWER_TOOL_NAME
      ) {
        hiddenToolCallIds.add(chunk.toolCallId);
        continue;
      }

      if (
        (chunk.type === "TOOL_CALL_ARGS" || chunk.type === "TOOL_CALL_END") &&
        hiddenToolCallIds.has(chunk.toolCallId)
      ) {
        if (
          chunk.type === "TOOL_CALL_END" &&
          acceptedAnswer &&
          !emittedFinalAnswer
        ) {
          emittedFinalAnswer = true;
          for (const textChunk of createTextChunks(
            acceptedAnswer.text,
            chunk
          )) {
            yield textChunk;
          }
        }
        continue;
      }

      if (
        chunk.type === "RUN_FINISHED" &&
        chunk.finishReason !== "tool_calls" &&
        !acceptedAnswer &&
        !emittedFinalAnswer
      ) {
        emittedFinalAnswer = true;
        for (const textChunk of createTextChunks(
          UNSUPPORTED_DOCS_RESPONSE,
          chunk
        )) {
          yield textChunk;
        }
      }

      yield chunk;
    }

    if (!emittedFinalAnswer && !acceptedAnswer && !sawRunError && lastChunk) {
      for (const textChunk of createTextChunks(
        UNSUPPORTED_DOCS_RESPONSE,
        lastChunk
      )) {
        yield textChunk;
      }
    }
  }

  return {
    middleware,
    shouldContinue: (iterationCount) =>
      !acceptedAnswer && iterationCount < MAX_AGENT_ITERATIONS,
    wrapStream,
  };
}

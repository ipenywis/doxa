import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

export const SUBMIT_ANSWER_TOOL_NAME = "submit_answer";

export const docsAnswerScopeSchema = z.enum([
  "supported",
  "partial",
  "unsupported",
]);

export const docsAnswerCitationSchema = z.object({
  title: z.string().min(1),
  href: z.string().min(1),
});

export const submitAnswerInputSchema = z.object({
  scope: docsAnswerScopeSchema,
  answer: z.string(),
  citations: z.array(docsAnswerCitationSchema),
  unsupportedReason: z.string().optional(),
});

export type DocsAnswerScope = z.infer<typeof docsAnswerScopeSchema>;
export type DocsAnswerCitation = z.infer<typeof docsAnswerCitationSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerInputSchema>;

const submitAnswerToolDefinition = toolDefinition({
  name: SUBMIT_ANSWER_TOOL_NAME,
  description:
    "Submit the final documentation-grounded answer for server validation. Always use this instead of writing final prose directly.",
  inputSchema: submitAnswerInputSchema,
});

export const submitAnswerTool = submitAnswerToolDefinition.server(
  (args: unknown) => submitAnswerInputSchema.parse(args)
);

/**
 * Agent Tools — Central registry for all available tools.
 *
 * Tools are defined as TanStack AI ServerTool instances.
 * To add a new tool, create it in its own file and add it to the array below.
 */

import { catTool } from "@/src/lib/agent/tools/cat";
import { grepTool } from "@/src/lib/agent/tools/grep";
import { submitAnswerTool } from "@/src/lib/agent/tools/submit-answer";

/** All tools available to the documentation agent. */
export const agentTools = [catTool, grepTool, submitAnswerTool];

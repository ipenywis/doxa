import { useCallback, useState } from "react";
import { LuChevronDown, LuChevronRight, LuTerminal } from "react-icons/lu";

import { BrailleSpinner } from "@/src/components/chat/agent-activity";

export interface ToolCallStep {
  id: string;
  name: string;
  args: string;
  result?: string;
  status: "calling" | "executing" | "completed" | "error";
}

interface ToolCallDisplayProps {
  step: ToolCallStep;
}

function parseArgs(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.command) return parsed.command;
    return raw;
  } catch {
    return raw;
  }
}

function truncateResult(
  result: string,
  maxLines = 8
): { text: string; truncated: boolean } {
  const lines = result.split("\n");
  if (lines.length <= maxLines) return { text: result, truncated: false };
  return {
    text: lines.slice(0, maxLines).join("\n"),
    truncated: true,
  };
}

export function ToolCallDisplay({ step }: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  const isActive = step.status === "calling" || step.status === "executing";
  const isDone = step.status === "completed";
  const isError = step.status === "error";

  const displayCommand = step.args ? parseArgs(step.args) : "...";

  return (
    <div className="my-1.5 max-w-[90%] overflow-hidden rounded-lg border border-border/50 bg-muted/30 text-xs">
      {/* Header */}
      <button
        onClick={toggle}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left hover:bg-muted/50"
        aria-expanded={expanded}
      >
        {/* Status indicator */}
        {isActive && (
          <BrailleSpinner className="size-3.5 shrink-0 text-primary" />
        )}
        {isDone && (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <svg
              viewBox="0 0 12 12"
              className="size-2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 6l3 3 5-5" />
            </svg>
          </span>
        )}
        {isError && (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <svg
              viewBox="0 0 12 12"
              className="size-2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </span>
        )}

        <LuTerminal className="size-3 shrink-0 text-muted-foreground" />

        <code className="flex-1 truncate font-mono text-[11px] text-foreground/80">
          <span className="font-semibold text-foreground">{step.name}</span>{" "}
          {displayCommand}
        </code>

        {step.result &&
          (expanded ? (
            <LuChevronDown className="size-3 shrink-0 text-muted-foreground" />
          ) : (
            <LuChevronRight className="size-3 shrink-0 text-muted-foreground" />
          ))}
      </button>

      {/* Expanded result */}
      {expanded && step.result && (
        <div className="border-t border-border/30 bg-background/50 px-3 py-2">
          <ResultContent result={step.result} />
        </div>
      )}
    </div>
  );
}

function ResultContent({ result }: { result: string }) {
  const [showFull, setShowFull] = useState(false);
  const { text, truncated } = truncateResult(result, 12);

  return (
    <div>
      <pre className="overflow-x-auto font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap text-muted-foreground">
        {showFull ? result : text}
      </pre>
      {truncated && !showFull && (
        <button
          onClick={() => setShowFull(true)}
          className="mt-1 cursor-pointer text-[10px] text-primary hover:underline"
        >
          Show full output
        </button>
      )}
    </div>
  );
}

interface ToolCallListProps {
  steps: ToolCallStep[];
}

export function ToolCallList({ steps }: ToolCallListProps) {
  if (steps.length === 0) return null;

  return (
    <div className="flex flex-col">
      {steps.map((step) => (
        <ToolCallDisplay key={step.id} step={step} />
      ))}
    </div>
  );
}

import React, {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import mermaid from "mermaid";

import { cn } from "@/src/lib/utils";

interface MermaidProps {
  chart: string;
  className?: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
});

let renderQueue: Promise<unknown> = Promise.resolve();

function queueMermaidRender<T>(task: () => Promise<T>): Promise<T> {
  const next = renderQueue.then(task, task);
  renderQueue = next.catch(() => undefined);
  return next;
}

function normalizeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function estimateDiagramHeight(chart: string) {
  const lines = chart
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const normalized = chart.trim().toLowerCase();

  if (normalized.startsWith("sequencediagram")) {
    const messages = lines.filter((line) =>
      /-{1,2}>>|-->>|->>|->|-->|-\)|-x/.test(line)
    ).length;
    const participants = lines.filter((line) =>
      /^(actor|participant)\s+/i.test(line)
    ).length;

    return clamp(155 + messages * 20 + participants * 6, 305, 720);
  }

  if (normalized.startsWith("erdiagram")) {
    const entityBlocks = (chart.match(/^\s*[A-Za-z_][\w-]*\s*\{/gm) ?? [])
      .length;
    const relationships = lines.filter((line) => line.includes("--")).length;
    const fields = lines.filter((line) =>
      /^(string|int|float|date|boolean|number)\s+/i.test(line)
    ).length;

    return clamp(
      240 + entityBlocks * 110 + relationships * 28 + fields * 8,
      320,
      820
    );
  }

  if (normalized.startsWith("graph") || normalized.startsWith("flowchart")) {
    const edges = lines.filter((line) => /-->|---|==>/.test(line)).length;
    return clamp(180 + edges * 18, 240, 620);
  }

  return clamp(220 + lines.length * 14, 260, 720);
}

function MermaidSkeleton() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-md border border-dashed border-border bg-muted/20"
      aria-hidden="true"
    >
      <div className="flex w-full max-w-[460px] flex-col gap-4 px-8">
        <div className="mx-auto h-8 w-28 animate-pulse rounded-sm border bg-background/70" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-7 animate-pulse rounded-sm border bg-background/70" />
          <div className="h-7 animate-pulse rounded-sm border bg-background/70" />
          <div className="h-7 animate-pulse rounded-sm border bg-background/70" />
        </div>
        <div className="mx-auto h-px w-3/4 bg-border" />
        <div className="grid grid-cols-2 gap-4 px-10">
          <div className="h-7 animate-pulse rounded-sm border bg-background/70" />
          <div className="h-7 animate-pulse rounded-sm border bg-background/70" />
        </div>
      </div>
    </div>
  );
}

const Mermaid = ({ chart, className }: MermaidProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const reactId = useId();
  const [isRendered, setIsRendered] = useState(false);
  const estimatedHeight = useMemo(() => estimateDiagramHeight(chart), [chart]);

  const memoizedClassName = useMemo(
    () => cn("doxa-mermaid not-prose relative my-6 overflow-x-auto", className),
    [className]
  );

  const style = useMemo(
    () =>
      ({
        "--mermaid-min-height": `${estimatedHeight}px`,
      }) as CSSProperties,
    [estimatedHeight]
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let cancelled = false;
    const renderId = `doxa-mermaid-${normalizeId(reactId)}`;

    setIsRendered(false);
    node.innerHTML = "";

    queueMermaidRender(() => mermaid.render(renderId, chart))
      .then(({ svg, bindFunctions }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        bindFunctions?.(ref.current);
        setIsRendered(true);
      })
      .catch((error) => {
        console.error("Mermaid diagram render error:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  return (
    <div
      className={memoizedClassName}
      data-mermaid-chart
      data-state={isRendered ? "rendered" : "loading"}
      style={style}
    >
      {!isRendered && <MermaidSkeleton />}
      <div
        ref={ref}
        className={cn(
          "min-h-[var(--mermaid-min-height)] transition-opacity duration-150",
          isRendered ? "opacity-100" : "opacity-0"
        )}
      />
      <span className="sr-only" aria-live="polite">
        {isRendered ? "Diagram rendered" : "Rendering diagram"}
      </span>
    </div>
  );
};

const MermaidMemo = React.memo(Mermaid);
export default MermaidMemo;

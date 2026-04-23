import { useEffect, useState } from "react";

const BRAILLE_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const FRAME_INTERVAL_MS = 90;

interface BrailleSpinnerProps {
  className?: string;
}

export function BrailleSpinner({ className }: BrailleSpinnerProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (id !== null) return;
      id = setInterval(() => {
        setFrame((f) => (f + 1) % BRAILLE_FRAMES.length);
      }, FRAME_INTERVAL_MS);
    };
    const stop = () => {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };

    if (typeof document === "undefined" || !document.hidden) start();

    const onVisibility = () => {
      if (typeof document !== "undefined" && document.hidden) stop();
      else start();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      stop();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, []);

  return (
    <span
      className={`inline-flex items-center justify-center font-mono leading-none ${className ?? ""}`}
      aria-hidden="true"
    >
      {BRAILLE_FRAMES[frame]}
    </span>
  );
}

interface AgentActivityFooterProps {
  status: string;
}

export function AgentActivityFooter({ status }: AgentActivityFooterProps) {
  return (
    <div
      className="flex items-center gap-2 px-1 py-1.5 font-mono text-[11px] text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <BrailleSpinner className="size-3 text-primary" />
      <span className="truncate">{status}</span>
    </div>
  );
}

import { PropsWithChildren } from "react";

import { cn } from "@/src/lib/utils";

type NoteProps = PropsWithChildren & {
  title?: string;
  type?: "note" | "success" | "warning" | "danger";
};

export default function Note({
  children,
  title = "Note",
  type = "note",
}: NoteProps) {
  const noteClassNames = cn({
    "bg-secondary": type == "note",
    "dark:bg-green-950 bg-green-100 border-green-300 dark:border-green-900":
      type === "success",
    "dark:bg-orange-950 bg-orange-100 border-orange-300 dark:border-orange-900":
      type === "warning",
    "dark:bg-red-950 bg-red-100 border-red-300 dark:border-red-900":
      type === "danger",
  });

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-0.5 text-sm tracking-wide sm:px-3.5",
        noteClassNames
      )}
    >
      <p className="-mb-3 text-sm font-semibold">{title}:</p>
      {children}
    </div>
  );
}

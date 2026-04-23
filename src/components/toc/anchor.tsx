import { LuList } from "react-icons/lu";

import { hrefToId } from "@/src/lib/toc";
import { cn } from "@/src/lib/utils";
import { useScrollSpy, type TocItem } from "@/src/hooks/use-scroll-spy";
import { ScrollArea } from "@/src/components/ui/scroll-area";

export interface TableAnchorProps {
  tocs: TocItem[];
}

const levelPadding: Record<number, string> = {
  2: "pl-3",
  3: "pl-6",
  4: "pl-9",
};

export function TableAnchor({ tocs }: TableAnchorProps) {
  const { activeId, handleSmoothScroll } = useScrollSpy(tocs);

  if (!tocs.length) return null;

  return (
    <div className="flex w-full flex-col gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <LuList className="h-4 w-4" />
        On this page
      </h3>
      <ScrollArea className="pb-4">
        <div className="flex flex-col border-l border-border/50">
          {tocs.map(({ href, level, text }) => (
            <a
              key={href}
              href={href}
              title={text}
              aria-label={text}
              onClick={(e) => handleSmoothScroll(e, href)}
              className={cn(
                "border-l-2 py-1.5 text-sm hover:text-foreground",
                levelPadding[level],
                activeId === hrefToId(href)
                  ? "border-primary font-medium text-primary hover:text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              {text}
            </a>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

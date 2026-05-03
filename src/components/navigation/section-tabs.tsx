import { useLocation } from "@tanstack/react-router";

import {
  getSectionFromPath,
  nonDefaultSections,
  visibleSections,
} from "@/src/settings/sections";
import { getPageRoutesForSection } from "@/src/lib/pageroutes";
import { Link } from "@/src/lib/transition";
import { cn } from "@/src/lib/utils";

export function SectionTabs() {
  const location = useLocation();

  // Hide entirely on single-section sites — keeps the existing UI unchanged.
  if (nonDefaultSections.length === 0) return null;

  const current = getSectionFromPath(location.pathname);

  return (
    <div
      className="-mx-4 mt-3 mb-2 overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none] sm:-mx-6 sm:mt-4 md:-mx-8 [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Documentation sections"
    >
      <div className="flex w-max items-center gap-4 px-4 sm:gap-6 sm:px-6 md:px-8">
        {visibleSections.map((section) => {
          const firstPage = getPageRoutesForSection(section.slug)[0];
          const href = firstPage?.href ?? "/";
          const active = current.slug === section.slug;
          return (
            <Link
              key={section.slug}
              href={href}
              role="tab"
              aria-selected={active}
              className={cn(
                "relative -mb-px flex shrink-0 items-center border-b-2 px-1 py-2.5 text-[13px] whitespace-nowrap transition-colors sm:py-3 sm:text-sm",
                active
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

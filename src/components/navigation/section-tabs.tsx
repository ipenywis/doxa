import type { RuntimeSection } from "@/src/runtime";
import { useLocation } from "@tanstack/react-router";

import {
  getSectionFromPath,
  nonDefaultSections,
  visibleSections,
} from "@/src/settings/sections";
import { getPageRoutesForSection } from "@/src/lib/pageroutes";
import { Link } from "@/src/lib/transition";
import { cn } from "@/src/lib/utils";

interface SectionTabsProps {
  sections?: RuntimeSection[];
  currentSectionSlug?: string | null;
  sectionHomeHrefs?: Record<string, string>;
}

export function SectionTabs({
  sections,
  currentSectionSlug,
  sectionHomeHrefs,
}: SectionTabsProps = {}) {
  const location = useLocation();
  const runtimeSections = sections?.filter((section) => !section.hidden);

  // Hide entirely on single-section sites — keeps the existing UI unchanged.
  if (
    runtimeSections
      ? runtimeSections.filter((section) => !section.default).length === 0
      : nonDefaultSections.length === 0
  ) {
    return null;
  }

  const currentSlug =
    currentSectionSlug ?? getSectionFromPath(location.pathname).slug;
  const tabSections = runtimeSections ?? visibleSections;

  return (
    <div
      className="-mx-4 mt-3 mb-2 overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none] sm:-mx-6 sm:mt-4 md:-mx-8 [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Documentation sections"
    >
      <div className="flex w-max items-center gap-4 px-4 sm:gap-6 sm:px-6 md:px-8">
        {tabSections.map((section) => {
          const href =
            sectionHomeHrefs?.[section.slug] ??
            getPageRoutesForSection(section.slug)[0]?.href ??
            "/";
          const active = currentSlug === section.slug;
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

import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

import { getSectionFromPath } from "@/src/settings/sections";
import { getPageRoutesForSection } from "@/src/lib/pageroutes";
import { Link } from "@/src/lib/transition";

function getPreviousNext(path: string) {
  const cleanPath = path.replace(/^docs\//, "");
  const targetHref = `/${cleanPath}`;
  const section = getSectionFromPath(`/docs${targetHref}`);
  const pages = getPageRoutesForSection(section.slug);

  const index = pages.findIndex((route) => route.href === targetHref);
  if (index === -1) {
    return { prev: null, next: null };
  }

  const prev = index > 0 ? pages[index - 1] : null;
  const next = index < pages.length - 1 ? pages[index + 1] : null;

  return { prev, next };
}

export function Pagination({ pathname }: { pathname: string }) {
  const res = getPreviousNext(pathname);

  return (
    <div className="mt-12 flex items-center justify-between gap-4 border-t pt-6 pb-4">
      {res.prev ? (
        <Link
          rel="prev"
          href={`/docs${res.prev.href}`}
          preload="viewport"
          title={`Previous: ${res.prev.title}`}
          className="group flex flex-col items-start gap-1 no-underline!"
        >
          <span className="flex items-center text-xs text-muted-foreground">
            <LuChevronLeft className="mr-0.5 h-3 w-3" />
            Previous
          </span>
          <span className="text-sm font-medium text-foreground group-hover:text-primary">
            {res.prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {res.next && (
        <Link
          rel="next"
          href={`/docs${res.next.href}`}
          preload="viewport"
          title={`Next: ${res.next.title}`}
          className="group ml-auto flex flex-col items-end gap-1 no-underline!"
        >
          <span className="flex items-center text-xs text-muted-foreground">
            Next
            <LuChevronRight className="ml-0.5 h-3 w-3" />
          </span>
          <span className="text-sm font-medium text-foreground group-hover:text-primary">
            {res.next.title}
          </span>
        </Link>
      )}
    </div>
  );
}

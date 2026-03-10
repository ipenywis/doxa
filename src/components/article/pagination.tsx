import { PageRoutes } from "@/src/lib/pageroutes"
import { Link } from "@/src/lib/transition"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"

function getPreviousNext(path: string) {
  const index = PageRoutes.findIndex(
    (route) => route.href === `/${path.replace("docs/", "")}`
  )

  if (index === -1) {
    return { prev: null, next: null }
  }

  const prev = index > 0 ? PageRoutes[index - 1] : null
  const next = index < PageRoutes.length - 1 ? PageRoutes[index + 1] : null

  return { prev, next }
}

export function Pagination({ pathname }: { pathname: string }) {
  const res = getPreviousNext(pathname)

  return (
    <div className="mt-12 flex items-center justify-between gap-4 border-t pt-6 pb-4">
      {res.prev ? (
        <Link
          rel="prev"
          href={`/docs${res.prev.href}`}
          title={`Previous: ${res.prev.title}`}
          className="group flex flex-col items-start gap-1 no-underline! transition-colors"
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
          title={`Next: ${res.next.title}`}
          className="group ml-auto flex flex-col items-end gap-1 no-underline! transition-colors"
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
  )
}

import Anchor from "@/src/components/anchor"
import { SheetClose } from "@/src/components/ui/sheet"
import { Paths, isRoute } from "@/src/lib/pageroutes"
import { cn } from "@/src/lib/utils"
import { useLocation } from "@tanstack/react-router"

export default function SubLink(
  props: Extract<Paths, { title: string; href: string }> & { isSheet: boolean }
) {
  const location = useLocation()
  const path = location.pathname

  if (!isRoute(props)) {
    return null
  }

  const { title, href, noLink, isSheet } = props
  const isActive = path === href

  const Comp = (
    <Anchor
      activeClassName="text-primary font-medium"
      href={href}
      preload="viewport"
      className={cn(
        "flex w-full items-center rounded-md px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground",
        isActive && "bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary",
      )}
    >
      {title}
    </Anchor>
  )

  const titleOrLink = !noLink ? (
    isSheet ? (
      <SheetClose asChild>{Comp}</SheetClose>
    ) : (
      Comp
    )
  ) : (
    <h2 className="px-2 py-1.5 text-sm font-semibold text-foreground">{title}</h2>
  )

  return <div className="flex flex-col">{titleOrLink}</div>
}

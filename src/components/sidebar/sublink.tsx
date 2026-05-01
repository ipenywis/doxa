import { useLocation } from "@tanstack/react-router";

import { getIcon } from "@/src/settings/icons";
import { isRoute, Paths } from "@/src/lib/pageroutes";
import { cn } from "@/src/lib/utils";
import { SheetClose } from "@/src/components/ui/sheet";
import Anchor from "@/src/components/anchor";

export default function SubLink(
  props: Extract<Paths, { title: string; href: string }> & { isSheet: boolean }
) {
  const location = useLocation();
  const path = location.pathname;

  if (!isRoute(props)) {
    return null;
  }

  const { title, href, icon, noLink, isSheet } = props;
  const isActive = path === href;
  const IconComp = getIcon(icon);

  const Comp = (
    <Anchor
      activeClassName="text-primary font-medium"
      href={href}
      preload="viewport"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground",
        isActive &&
          "bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary"
      )}
    >
      {IconComp && <IconComp className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span className="truncate">{title}</span>
    </Anchor>
  );

  const titleOrLink = !noLink ? (
    isSheet ? (
      <SheetClose asChild>{Comp}</SheetClose>
    ) : (
      Comp
    )
  ) : (
    <h2 className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-foreground">
      {IconComp && <IconComp className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span>{title}</span>
    </h2>
  );

  return <div className="flex flex-col">{titleOrLink}</div>;
}

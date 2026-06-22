import type { RuntimeNavNode, RuntimeNavPage } from "@/src/runtime";

import { Routes, type Paths } from "@/src/lib/pageroutes";
import SubLink, { type SubLinkRoute } from "@/src/components/sidebar/sublink";

type MenuRoute = Paths | RuntimeNavNode;

interface PageMenuProps {
  isSheet?: boolean;
  routes?: MenuRoute[];
  variant?: "docs" | "reference";
}

export function PageMenu({
  isSheet = false,
  routes,
  variant = "docs",
}: PageMenuProps) {
  const list = routes ?? Routes;
  const isReference = variant === "reference";

  return (
    <div className={`flex flex-col pb-6 ${isReference ? "gap-0.5" : "gap-1"}`}>
      {list.map((item, index) => {
        if ("spacer" in item) {
          return (
            <div
              key={`spacer-${index}`}
              className={`${index === 0 ? "" : "mt-4 mb-2 border-t border-foreground/10 dark:border-foreground/[0.06]"}`}
            />
          );
        }
        if (isMenuHeading(item)) {
          return (
            <div
              key={`heading-${item.heading}-${index}`}
              className={`${isReference ? "mt-3 mb-1" : "mt-2 mb-2"} px-2 text-[0.7rem] font-semibold text-foreground/50 dark:text-foreground/45`}
            >
              {item.heading}
            </div>
          );
        }
        if (isMenuPage(item)) {
          return (
            <SubLink
              key={item.href}
              {...{
                ...item,
                href: item.href,
                isSheet,
              }}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

function isMenuHeading(
  item: MenuRoute
): item is Extract<MenuRoute, { heading: string }> {
  return "heading" in item && !("title" in item);
}

function isMenuPage(item: MenuRoute): item is RuntimeNavPage & SubLinkRoute {
  return "title" in item && "href" in item;
}

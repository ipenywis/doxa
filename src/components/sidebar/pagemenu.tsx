import { isHeading, isRoute, Routes, type Paths } from "@/src/lib/pageroutes";
import SubLink from "@/src/components/sidebar/sublink";

interface PageMenuProps {
  isSheet?: boolean;
  routes?: Paths[];
}

export function PageMenu({ isSheet = false, routes }: PageMenuProps) {
  const list = routes ?? Routes;

  return (
    <div className="flex flex-col gap-1 pb-6">
      {list.map((item, index) => {
        if ("spacer" in item) {
          return (
            <div
              key={`spacer-${index}`}
              className={`${index === 0 ? "" : "mt-4 mb-2 border-t border-foreground/10 dark:border-foreground/[0.06]"}`}
            />
          );
        }
        if (isHeading(item)) {
          return (
            <div
              key={`heading-${item.heading}-${index}`}
              className="mt-2 mb-2 px-2 text-[0.7rem] font-semibold text-foreground/50 dark:text-foreground/45"
            >
              {item.heading}
            </div>
          );
        }
        if (isRoute(item)) {
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

"use client"

import SubLink from "@/src/components/sidebar/sublink"
import { isHeading, isRoute, Routes } from "@/src/lib/pageroutes"
import { useLocation } from "@tanstack/react-router"

export function PageMenu({ isSheet = false }) {
  const location = useLocation()
  const pathname = location.pathname
  if (!pathname.startsWith("/docs")) return null

  return (
    <div className="flex flex-col gap-1 pb-6">
      {Routes.map((item, index) => {
        if ("spacer" in item) {
          return (
            <div
              key={`spacer-${index}`}
              className={`${index === 0 ? "" : "mt-4 mb-2 border-t border-foreground/10 dark:border-foreground/[0.06]"}`}
            />
          )
        }
        if (isHeading(item)) {
          return (
            <div
              key={`heading-${item.heading}-${index}`}
              className="mt-2 mb-2 px-2 text-[0.7rem] font-semibold text-foreground/50 dark:text-foreground/45"
            >
              {item.heading}
            </div>
          )
        }
        if (isRoute(item)) {
          return (
            <SubLink
              key={item.href}
              {...{
                ...item,
                href: `/docs${item.href}`,
                isSheet,
              }}
            />
          )
        }
        return null
      })}
    </div>
  )
}

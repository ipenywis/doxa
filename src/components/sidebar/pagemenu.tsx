"use client"

import SubLink from "@/src/components/sidebar/sublink"
import { Separator } from "@/src/components/ui/separator"
import { Routes } from "@/src/lib/pageroutes"
import { useLocation } from "@tanstack/react-router"

export function PageMenu({ isSheet = false }) {
  const location = useLocation()
  const pathname = location.pathname
  if (!pathname.startsWith("/docs")) return null

  return (
    <div className="flex flex-col gap-3.5 pb-6">
      {Routes.map((item, index) => {
        if ("spacer" in item) {
          return <Separator key={`spacer-${index}`} className="my-2" />
        }
        return (
          <div key={item.title + index}>
            {item.heading && (
              <div className="mb-4 text-sm font-bold">{item.heading}</div>
            )}
            <SubLink
              {...{
                ...item,
                href: `/docs${item.href}`,
                level: 0,
                isSheet,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

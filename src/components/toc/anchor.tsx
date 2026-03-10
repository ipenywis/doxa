"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { cn } from "@/src/lib/utils"
import { LuList } from "react-icons/lu"

export interface TableAnchorProps {
  tocs: { href: string; level: number; text: string }[]
}

export function TableAnchor({ tocs }: TableAnchorProps) {
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px", threshold: 0 }
    )

    const headingElements = tocs
      .map(({ href }) => {
        const id = href.startsWith("#") ? href.slice(1) : href
        return document.getElementById(id)
      })
      .filter(Boolean) as HTMLElement[]

    headingElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [tocs])

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault()
    const id = href.startsWith("#") ? href.slice(1) : href
    const targetElement = document.getElementById(id)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" })
      window.history.pushState(null, "", href)
    }
  }

  if (!tocs.length) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <LuList className="h-4 w-4" />
        On this page
      </h3>
      <ScrollArea className="pb-4">
        <div className="flex flex-col border-l border-border/50">
          {tocs.map(({ href, level, text }) => {
            const id = href.startsWith("#") ? href.slice(1) : href
            const isActive = activeId === id

            return (
              <a
                key={href}
                href={href}
                title={text}
                aria-label={text}
                onClick={(e) => handleSmoothScroll(e, href)}
                className={cn(
                  "border-l-2 py-1.5 text-sm transition-colors hover:text-foreground",
                  level === 2 && "pl-3",
                  level === 3 && "pl-6",
                  level === 4 && "pl-9",
                  isActive
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground"
                )}
              >
                {text}
              </a>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

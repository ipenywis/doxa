"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { cn } from "@/src/lib/utils"
import { LuList } from "react-icons/lu"

export interface TableAnchorProps {
  tocs: { href: string; level: number; text: string }[]
}

// Navbar height is h-16 = 64px. Headings have scroll-m-20 = 80px scroll-margin.
// The reading line is placed at 80px from viewport top so that clicking a TOC
// link (which scrolls the heading to 80px) and scroll-based activation stay
// perfectly in sync.
const READING_LINE_OFFSET = 80

export function TableAnchor({ tocs }: TableAnchorProps) {
  const [activeId, setActiveId] = useState<string>("")
  const clickScrollingRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const tocIds = tocs.map(({ href }) =>
      href.startsWith("#") ? href.slice(1) : href
    )

    const getHeadings = (): HTMLElement[] => {
      const byId = tocIds
        .map((id) => document.getElementById(id))
        .filter(Boolean) as HTMLElement[]

      if (byId.length > 0) return byId

      // Fallback: query article headings directly in case of slug mismatch
      const article = document.querySelector("article")
      if (!article) return []
      return Array.from(
        article.querySelectorAll<HTMLElement>("h2[id], h3[id], h4[id]")
      )
    }

    const computeActive = () => {
      rafRef.current = null

      // Don't update during click-initiated smooth scrolling
      if (clickScrollingRef.current) return

      const headings = getHeadings()
      if (headings.length === 0) return

      // At the bottom of the page, always activate the last heading
      if (
        window.innerHeight + window.scrollY >=
        document.body.scrollHeight - 2
      ) {
        setActiveId(headings[headings.length - 1].id)
        return
      }

      // A heading's "section" runs from its position to the next heading.
      // The active heading is the last one whose absolute top is at or above
      // the reading line. Iterating in reverse finds this in O(1) average case.
      const readingLine = window.scrollY + READING_LINE_OFFSET

      let active = headings[0]
      for (let i = headings.length - 1; i >= 0; i--) {
        const absoluteTop =
          headings[i].getBoundingClientRect().top + window.scrollY
        if (absoluteTop <= readingLine) {
          active = headings[i]
          break
        }
      }

      setActiveId(active.id)
    }

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(computeActive)
      }
    }

    // MutationObserver: wait for async MDX content to render
    let moActive = true
    const mo = new MutationObserver(() => {
      if (getHeadings().length > 0 && moActive) {
        moActive = false
        mo.disconnect()
        computeActive()
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    window.addEventListener("scroll", onScroll, { passive: true })

    // Try immediately in case content is already rendered
    if (getHeadings().length > 0) {
      moActive = false
      mo.disconnect()
      computeActive()
    }

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      window.removeEventListener("scroll", onScroll)
      if (moActive) mo.disconnect()
    }
  }, [tocs])

  // Clean up any pending unlock timer on unmount
  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)
    }
  }, [])

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault()
    const id = href.startsWith("#") ? href.slice(1) : href
    const targetElement = document.getElementById(id)
    if (!targetElement) return

    // Lock scroll tracking and immediately highlight the clicked item.
    // This prevents the active state from flickering through intermediate
    // headings during the smooth scroll animation.
    clickScrollingRef.current = true
    setActiveId(id)

    targetElement.scrollIntoView({ behavior: "smooth" })
    window.history.pushState(null, "", href)

    // Unlock scroll tracking once the smooth scroll finishes
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)

    const unlock = () => {
      clickScrollingRef.current = false
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current)
        unlockTimerRef.current = null
      }
    }

    // scrollend fires when smooth scroll completes; timeout as fallback
    window.addEventListener("scrollend", unlock, { once: true })
    unlockTimerRef.current = setTimeout(() => {
      window.removeEventListener("scrollend", unlock)
      unlock()
    }, 1000)
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

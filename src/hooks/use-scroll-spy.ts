import { useCallback, useEffect, useRef, useState } from "react"
import {
  computeReadingLine,
  findActiveHeadingId,
  findHeadingElements,
  getAppScrollContainer,
  getScrollRootMetrics,
  hrefToId,
} from "@/src/lib/toc"

export interface TocItem {
  href: string
  level: number
  text: string
}

const SCROLL_LOCK_TIMEOUT = 1000
const INSTANT_SCROLL_SETTLE = 150
const HASH_POLL_INTERVAL = 50
const HASH_POLL_MAX = 3000

/**
 * Tracks which TOC heading is currently active based on scroll position.
 *
 * Handles three scroll scenarios, each with a lock that prevents the
 * scroll spy from overwriting the intended active heading:
 *
 * 1. **Page load / refresh with hash** — polls for the target element
 *    (MDX renders async), then instant-scrolls when found.
 * 2. **TOC click** — smooth-scrolls to the heading.
 * 3. **Browser back/forward** — smooth-scrolls on `hashchange`.
 */
export function useScrollSpy(tocs: TocItem[]) {
  const [activeId, setActiveId] = useState("")

  const scrollRootRef = useRef<HTMLElement | Window | null>(null)
  const scrollLockedRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- shared scroll-lock helpers ----------------------------------------

  const lock = useCallback((id: string) => {
    scrollLockedRef.current = true
    setActiveId(id)
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)
  }, [])

  const unlock = useCallback(() => {
    scrollLockedRef.current = false
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current)
      unlockTimerRef.current = null
    }
  }, [])

  /** Lock, scroll to `target`, then unlock when done. */
  const scrollWithLock = useCallback(
    (id: string, target: HTMLElement, behavior: ScrollBehavior) => {
      lock(id)
      target.scrollIntoView({ behavior })

      if (behavior === "smooth") {
        const onEnd = () => {
          unlock()
          clearTimeout(fallback)
        }
        const scrollRoot = scrollRootRef.current ?? window
        scrollRoot.addEventListener("scrollend", onEnd, { once: true })
        const fallback = setTimeout(() => {
          scrollRoot.removeEventListener("scrollend", onEnd)
          unlock()
        }, SCROLL_LOCK_TIMEOUT)
        unlockTimerRef.current = fallback
      } else {
        unlockTimerRef.current = setTimeout(unlock, INSTANT_SCROLL_SETTLE)
      }
    },
    [lock, unlock]
  )

  // --- main effect -------------------------------------------------------

  useEffect(() => {
    const tocIds = tocs.map(({ href }) => hrefToId(href))
    const scrollRoot = getAppScrollContainer() ?? window
    scrollRootRef.current = scrollRoot

    // ---- Scroll spy ------------------------------------------------------

    const computeActive = () => {
      rafRef.current = null
      if (scrollLockedRef.current) return

      const headings = findHeadingElements(tocIds)
      if (headings.length === 0) return

      const metrics = getScrollRootMetrics(scrollRoot)
      const readingLine = computeReadingLine(
        metrics.scrollTop,
        metrics.viewportHeight,
        metrics.scrollHeight
      )
      setActiveId(findActiveHeadingId(headings, readingLine, metrics))
    }

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(computeActive)
      }
    }

    scrollRoot.addEventListener("scroll", onScroll, { passive: true })

    // ---- Hash scroll (page load / refresh) -------------------------------
    // Capture the hash NOW and lock immediately so that no scroll event
    // can overwrite the active heading while we wait for the element.
    // We poll for the target because MDX content renders asynchronously
    // and the heading may not exist in the DOM yet.

    const initialHash = window.location.hash
    const hashTargetId = initialHash ? hrefToId(initialHash) : null
    let hashHandled = !hashTargetId
    let hashPollTimer: ReturnType<typeof setTimeout> | null = null
    let hashGiveUpTimer: ReturnType<typeof setTimeout> | null = null

    if (hashTargetId) {
      scrollLockedRef.current = true
      setActiveId(hashTargetId)
    }

    const attemptHashScroll = () => {
      if (hashHandled) return
      const target = hashTargetId ? document.getElementById(hashTargetId) : null

      if (target) {
        hashHandled = true
        // Double-RAF: wait for layout to fully settle before scrolling.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: "instant" })
            unlockTimerRef.current = setTimeout(unlock, INSTANT_SCROLL_SETTLE)
          })
        })
      } else {
        // Element not in DOM yet (async MDX) — retry.
        hashPollTimer = setTimeout(attemptHashScroll, HASH_POLL_INTERVAL)
      }
    }

    if (hashTargetId) {
      attemptHashScroll()
      // Safety net: stop polling after HASH_POLL_MAX and fall back to
      // normal scroll tracking.
      hashGiveUpTimer = setTimeout(() => {
        if (!hashHandled) {
          hashHandled = true
          unlock()
          computeActive()
        }
      }, HASH_POLL_MAX)
    }

    // ---- Initial scroll spy activation (no-hash case) --------------------
    // When there's no hash, detect when headings first appear so we can
    // compute the initial active heading.

    let moActive = true
    const mo = new MutationObserver(() => {
      if (findHeadingElements(tocIds).length > 0 && moActive) {
        moActive = false
        mo.disconnect()
        if (!hashTargetId) computeActive()
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    // Headings might already be in the DOM (cached / pre-rendered).
    if (findHeadingElements(tocIds).length > 0) {
      moActive = false
      mo.disconnect()
      if (!hashTargetId) computeActive()
    }

    // ---- Browser back/forward --------------------------------------------

    const onHashChange = () => {
      const hash = window.location.hash
      if (!hash) return
      const id = hrefToId(hash)
      const target = document.getElementById(id)
      if (target) scrollWithLock(id, target, "smooth")
    }
    window.addEventListener("hashchange", onHashChange)

    // ---- Cleanup ---------------------------------------------------------

    return () => {
      if (hashPollTimer) clearTimeout(hashPollTimer)
      if (hashGiveUpTimer) clearTimeout(hashGiveUpTimer)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      scrollRoot.removeEventListener("scroll", onScroll)
      window.removeEventListener("hashchange", onHashChange)
      if (moActive) mo.disconnect()
    }
  }, [tocs, lock, unlock, scrollWithLock])

  // Clean up the unlock timer on unmount.
  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)
    }
  }, [])

  // --- TOC click handler -------------------------------------------------

  const handleSmoothScroll = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault()
      const id = hrefToId(href)
      const target = document.getElementById(id)
      if (!target) return

      scrollWithLock(id, target, "smooth")
      window.history.pushState(null, "", href)
    },
    [scrollWithLock]
  )

  return { activeId, handleSmoothScroll }
}

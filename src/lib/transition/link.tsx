import { useCallback, type ComponentProps, type MouseEvent } from "react"
import { Link as RouterLink, useNavigate, useSearch } from "@tanstack/react-router"

import { startViewTransitionIfSupported } from "@/src/lib/transition/document-view-transition"

function isModifiedEvent(event: MouseEvent): boolean {
  const eventTarget = event.currentTarget as HTMLAnchorElement | SVGAElement
  const target = eventTarget.getAttribute("target")
  return (
    (target && target !== "_self") ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.nativeEvent && event.button === 1)
  )
}

function shouldPreserveDefault(e: MouseEvent<HTMLAnchorElement>): boolean {
  const { nodeName } = e.currentTarget

  const isAnchorNodeName = nodeName.toUpperCase() === "A"

  if (isAnchorNodeName && isModifiedEvent(e)) {
    return true
  }

  return false
}

interface LinkProps extends Omit<ComponentProps<"a">, "href"> {
  href: string
  replace?: boolean
  scroll?: boolean
  preload?: ComponentProps<typeof RouterLink>["preload"]
  preloadDelay?: ComponentProps<typeof RouterLink>["preloadDelay"]
}

export function Link({
  href,
  onClick,
  preload,
  preloadDelay,
  replace,
  scroll,
  children,
  ...rest
}: LinkProps) {
  const navigate = useNavigate()
  const rootSearch = useSearch({ from: "__root__" })
  const demoSearch = rootSearch.demo ? { demo: true as const } : undefined

  // Handle external links
  if (href.startsWith("http") || href.startsWith("//")) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  }

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick(e)
      }

      if (e.defaultPrevented) {
        return
      }

      if ("startViewTransition" in document) {
        if (shouldPreserveDefault(e)) {
          return
        }

        e.preventDefault()

        startViewTransitionIfSupported(() => {
          navigate({
            to: href,
            replace,
            resetScroll: scroll,
            search: demoSearch,
          })
        })
      }
    },
    [onClick, href, replace, scroll, navigate, demoSearch]
  )

  return (
    <RouterLink
      to={href}
      onClick={handleClick}
      preload={preload}
      preloadDelay={preloadDelay}
      resetScroll={scroll}
      search={demoSearch}
      {...rest}
    >
      {children}
    </RouterLink>
  )
}

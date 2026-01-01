import { useCallback, type ComponentProps, type MouseEvent } from "react"
import { Link as RouterLink, useNavigate } from "@tanstack/react-router"

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
}

export function Link({
  href,
  onClick,
  replace,
  scroll,
  children,
  ...rest
}: LinkProps) {
  const navigate = useNavigate()

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

        const viewTransition = (document as any).startViewTransition(() => {
          navigate({
            to: href,
            replace,
          })
        })
      }
    },
    [onClick, href, replace, navigate]
  )

  return (
    <RouterLink to={href} onClick={handleClick} {...rest}>
      {children}
    </RouterLink>
  )
}

import { useCallback } from "react"
import { useNavigate } from "@tanstack/react-router"

interface NavigateOptions {
  scroll?: boolean
}

export function useTransitionRouter() {
  const navigate = useNavigate()

  const push = useCallback(
    (href: string, options?: NavigateOptions) => {
      if ("startViewTransition" in document) {
        ;(document as any).startViewTransition(() => {
          navigate({ to: href })
        })
      } else {
        navigate({ to: href })
      }
    },
    [navigate]
  )

  const replace = useCallback(
    (href: string, options?: NavigateOptions) => {
      if ("startViewTransition" in document) {
        ;(document as any).startViewTransition(() => {
          navigate({ to: href, replace: true })
        })
      } else {
        navigate({ to: href, replace: true })
      }
    },
    [navigate]
  )

  const back = useCallback(() => {
    if ("startViewTransition" in document) {
      ;(document as any).startViewTransition(() => {
        window.history.back()
      })
    } else {
      window.history.back()
    }
  }, [])

  const forward = useCallback(() => {
    if ("startViewTransition" in document) {
      ;(document as any).startViewTransition(() => {
        window.history.forward()
      })
    } else {
      window.history.forward()
    }
  }, [])

  return {
    push,
    replace,
    back,
    forward,
  }
}

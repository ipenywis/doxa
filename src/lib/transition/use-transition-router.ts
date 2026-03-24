import { useCallback } from "react"
import { useNavigate } from "@tanstack/react-router"

import { startViewTransitionIfSupported } from "@/src/lib/transition/document-view-transition"

interface NavigateOptions {
  scroll?: boolean
}

export function useTransitionRouter() {
  const navigate = useNavigate()

  const push = useCallback(
    (href: string, _options?: NavigateOptions) => {
      if ("startViewTransition" in document) {
        startViewTransitionIfSupported(() => {
          navigate({ to: href })
        })
      } else {
        navigate({ to: href })
      }
    },
    [navigate]
  )

  const replace = useCallback(
    (href: string, _options?: NavigateOptions) => {
      if ("startViewTransition" in document) {
        startViewTransitionIfSupported(() => {
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
      startViewTransitionIfSupported(() => {
        window.history.back()
      })
    } else {
      window.history.back()
    }
  }, [])

  const forward = useCallback(() => {
    if ("startViewTransition" in document) {
      startViewTransitionIfSupported(() => {
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

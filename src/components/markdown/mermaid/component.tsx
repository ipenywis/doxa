import React, { useEffect, useMemo, useRef } from "react"
import { cn } from "@/src/lib/utils"
import mermaid from "mermaid"

interface MermaidProps {
  chart: string
  className?: string
}

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
})

const Mermaid = ({ chart, className }: MermaidProps) => {
  const ref = useRef<HTMLDivElement | null>(null)

  const memoizedClassName = useMemo(
    () => cn("mermaid", className),
    [className]
  )

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let cancelled = false
    const renderId = `mermaid-${Math.random().toString(36).slice(2, 10)}`

    mermaid
      .render(renderId, chart)
      .then(({ svg, bindFunctions }) => {
        if (cancelled || !ref.current) return
        ref.current.innerHTML = svg
        bindFunctions?.(ref.current)
      })
      .catch((error) => {
        console.error("Mermaid diagram render error:", error)
      })

    return () => {
      cancelled = true
    }
  }, [chart])

  return <div className={memoizedClassName} ref={ref} />
}

const MermaidMemo = React.memo(Mermaid)
export default MermaidMemo

"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { primaryColor } from "@/src/contents/settings/color"
import { getColorPreset } from "@/src/lib/colors"

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const preset = getColorPreset(primaryColor)
    const mode = resolvedTheme === "dark" ? "dark" : "light"
    const colors = preset[mode]

    document.documentElement.style.setProperty("--primary", colors.primary)
    document.documentElement.style.setProperty(
      "--primary-foreground",
      colors.primaryForeground,
    )
  }, [resolvedTheme])

  return <>{children}</>
}

import { useEffect } from "react"

import { ViewTransitions } from "@/src/lib/transition"
import { ThemeProvider } from "@/src/providers/theme"

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    document.documentElement.style.visibility = ""
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ViewTransitions>{children}</ViewTransitions>
    </ThemeProvider>
  )
}

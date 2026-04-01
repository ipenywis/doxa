import { ViewTransitions } from "@/src/lib/transition"
import { ColorProvider } from "@/src/providers/color"
import { ThemeProvider } from "@/src/providers/theme"
import { getTheme } from "@/src/lib/themes"
import { activeTheme } from "@/src/contents/settings/theme"

const theme = getTheme(activeTheme)
const isDarkOnly = theme.colorMode === "dark-only"

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={isDarkOnly ? "dark" : "system"}
      enableSystem={!isDarkOnly}
      forcedTheme={isDarkOnly ? "dark" : undefined}
    >
      <ColorProvider>
        <ViewTransitions>{children}</ViewTransitions>
      </ColorProvider>
    </ThemeProvider>
  )
}

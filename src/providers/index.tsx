import { ViewTransitions } from "@/src/lib/transition"
import { ColorProvider } from "@/src/providers/color"
import { ThemeProvider } from "@/src/providers/theme"
import { getTheme } from "@/src/lib/themes"
import themeSettings from "@/src/contents/settings/theme.json"

const theme = getTheme(themeSettings.activeTheme)
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

import { ViewTransitions } from "@/src/lib/transition"
import { ColorProvider } from "@/src/providers/color"
import { ThemeProvider } from "@/src/providers/theme"

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ColorProvider>
        <ViewTransitions>{children}</ViewTransitions>
      </ColorProvider>
    </ThemeProvider>
  )
}

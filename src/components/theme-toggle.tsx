"use client"

import { Button } from "@/src/components/ui/button"
import { useTheme } from "next-themes"
import { RxMoon, RxSun } from "react-icons/rx"
import { getTheme } from "@/src/lib/themes"
import { activeTheme } from "@/src/contents/settings/theme"

const siteTheme = getTheme(activeTheme)

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  if (siteTheme.colorMode === "dark-only") return null

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 cursor-pointer"
    >
      <RxSun className="h-[1.1rem] w-[1.1rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <RxMoon className="absolute h-[1.1rem] w-[1.1rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

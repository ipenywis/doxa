import type { ColorPreset } from "@/src/lib/colors"
import type { ThemeName } from "@/src/lib/themes"

declare module "*/contents/settings/theme.json" {
  const themeSettings: {
    primaryColor: ColorPreset
    activeTheme: ThemeName
  }
  export default themeSettings
}

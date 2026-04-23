import rawThemeSettings from "@/src/contents/settings/theme.json";

import type { ColorPreset } from "@/src/lib/colors";
import type { ThemeName } from "@/src/lib/themes";

export interface ThemeSettings {
  primaryColor: ColorPreset;
  activeTheme: ThemeName;
}

const colorPresets = [
  "default",
  "indigo",
  "emerald",
  "rose",
  "amber",
  "violet",
] as const satisfies readonly ColorPreset[];

const themeNames = [
  "default",
  "brutalist",
] as const satisfies readonly ThemeName[];
const colorPresetSet: ReadonlySet<string> = new Set(colorPresets);
const themeNameSet: ReadonlySet<string> = new Set(themeNames);

function isColorPreset(value: string): value is ColorPreset {
  return colorPresetSet.has(value);
}

function isThemeName(value: string): value is ThemeName {
  return themeNameSet.has(value);
}

function parseThemeSettings(settings: typeof rawThemeSettings): ThemeSettings {
  if (!isColorPreset(settings.primaryColor)) {
    throw new Error(`Unknown primary color: ${settings.primaryColor}`);
  }

  if (!isThemeName(settings.activeTheme)) {
    throw new Error(`Unknown active theme: ${settings.activeTheme}`);
  }

  return {
    primaryColor: settings.primaryColor,
    activeTheme: settings.activeTheme,
  };
}

const themeSettings = parseThemeSettings(rawThemeSettings);

export default themeSettings;

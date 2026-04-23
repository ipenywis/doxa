export type ColorPreset =
  | "default"
  | "indigo"
  | "emerald"
  | "rose"
  | "amber"
  | "violet";

interface ColorValues {
  primary: string;
  primaryForeground: string;
}

interface ColorPresetConfig {
  light: ColorValues;
  dark: ColorValues;
}

export const colorPresets: Record<ColorPreset, ColorPresetConfig> = {
  default: {
    light: {
      primary: "oklch(0.205 0 0)",
      primaryForeground: "oklch(0.985 0 0)",
    },
    dark: {
      primary: "oklch(0.985 0 0)",
      primaryForeground: "oklch(0.205 0 0)",
    },
  },
  indigo: {
    light: {
      primary: "oklch(0.585 0.233 277)",
      primaryForeground: "oklch(0.985 0 0)",
    },
    dark: {
      primary: "oklch(0.685 0.2 277)",
      primaryForeground: "oklch(0.985 0 0)",
    },
  },
  emerald: {
    light: {
      primary: "oklch(0.596 0.145 163)",
      primaryForeground: "oklch(0.985 0 0)",
    },
    dark: {
      primary: "oklch(0.696 0.17 163)",
      primaryForeground: "oklch(0.985 0 0)",
    },
  },
  rose: {
    light: {
      primary: "oklch(0.585 0.22 5)",
      primaryForeground: "oklch(0.985 0 0)",
    },
    dark: {
      primary: "oklch(0.685 0.2 5)",
      primaryForeground: "oklch(0.985 0 0)",
    },
  },
  amber: {
    light: {
      primary: "oklch(0.65 0.18 75)",
      primaryForeground: "oklch(0.985 0 0)",
    },
    dark: {
      primary: "oklch(0.75 0.16 75)",
      primaryForeground: "oklch(0.985 0 0)",
    },
  },
  violet: {
    light: {
      primary: "oklch(0.541 0.25 293)",
      primaryForeground: "oklch(0.985 0 0)",
    },
    dark: {
      primary: "oklch(0.641 0.22 293)",
      primaryForeground: "oklch(0.985 0 0)",
    },
  },
};

export function getColorPreset(name: ColorPreset): ColorPresetConfig {
  return colorPresets[name];
}

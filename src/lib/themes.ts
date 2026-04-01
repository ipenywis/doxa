export type ThemeColorMode = "light-dark" | "dark-only"

export interface ThemeTokens {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
  radius: string
  // Chart tokens
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
  // Sidebar tokens
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  sidebarRing: string
  // Inline code tokens
  codeBg: string
  codeFg: string
  codeBorder: string
}

export interface ThemeDefinition {
  name: string
  colorMode: ThemeColorMode
  light: ThemeTokens
  dark?: ThemeTokens
  bodyFont: string
  codeFont: string
  fonts: { href: string }[]
  extraCss?: string
}

export type ThemeName = "default" | "brutalist"

// ---------------------------------------------------------------------------
// Default theme — reproduces the current globals.css light/dark values exactly
// ---------------------------------------------------------------------------

const defaultTheme: ThemeDefinition = {
  name: "Default",
  colorMode: "light-dark",
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.145 0 0)",
    primary: "oklch(0.205 0 0)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.97 0 0)",
    secondaryForeground: "oklch(0.205 0 0)",
    muted: "oklch(0.97 0 0)",
    mutedForeground: "oklch(0.556 0 0)",
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.205 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    destructiveForeground: "oklch(0.577 0.245 27.325)",
    border: "oklch(0.922 0 0)",
    input: "oklch(0.922 0 0)",
    ring: "oklch(0.708 0 0)",
    radius: "0.625rem",
    chart1: "oklch(0.646 0.222 41.116)",
    chart2: "oklch(0.6 0.118 184.704)",
    chart3: "oklch(0.398 0.07 227.392)",
    chart4: "oklch(0.828 0.189 84.429)",
    chart5: "oklch(0.769 0.188 70.08)",
    sidebar: "oklch(0.985 0 0)",
    sidebarForeground: "oklch(0.145 0 0)",
    sidebarPrimary: "oklch(0.205 0 0)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.97 0 0)",
    sidebarAccentForeground: "oklch(0.205 0 0)",
    sidebarBorder: "oklch(0.922 0 0)",
    sidebarRing: "oklch(0.708 0 0)",
    codeBg: "oklch(0.96 0 0)",
    codeFg: "oklch(0.3 0 0)",
    codeBorder: "oklch(0.9 0 0)",
  },
  dark: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.145 0 0)",
    cardForeground: "oklch(0.985 0 0)",
    popover: "oklch(0.145 0 0)",
    popoverForeground: "oklch(0.985 0 0)",
    primary: "oklch(0.985 0 0)",
    primaryForeground: "oklch(0.205 0 0)",
    secondary: "oklch(0.269 0 0)",
    secondaryForeground: "oklch(0.985 0 0)",
    muted: "oklch(0.269 0 0)",
    mutedForeground: "oklch(0.708 0 0)",
    accent: "oklch(0.269 0 0)",
    accentForeground: "oklch(0.985 0 0)",
    destructive: "oklch(0.396 0.141 25.723)",
    destructiveForeground: "oklch(0.637 0.237 25.331)",
    border: "oklch(0.269 0 0)",
    input: "oklch(0.269 0 0)",
    ring: "oklch(0.439 0 0)",
    radius: "0.625rem",
    chart1: "oklch(0.488 0.243 264.376)",
    chart2: "oklch(0.696 0.17 162.48)",
    chart3: "oklch(0.769 0.188 70.08)",
    chart4: "oklch(0.627 0.265 303.9)",
    chart5: "oklch(0.645 0.246 16.439)",
    sidebar: "oklch(0.205 0 0)",
    sidebarForeground: "oklch(0.985 0 0)",
    sidebarPrimary: "oklch(0.488 0.243 264.376)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.269 0 0)",
    sidebarAccentForeground: "oklch(0.985 0 0)",
    sidebarBorder: "oklch(0.269 0 0)",
    sidebarRing: "oklch(0.439 0 0)",
    codeBg: "oklch(0.25 0 0)",
    codeFg: "oklch(0.8 0 0)",
    codeBorder: "oklch(0.35 0 0)",
  },
  bodyFont: '"Inter", system-ui, -apple-system, sans-serif',
  codeFont: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
  fonts: [
    {
      href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap",
    },
  ],
}

// ---------------------------------------------------------------------------
// Brutalist theme — pure black, monospace-first, sharp corners, blue accent
// Inspired by ../website
// ---------------------------------------------------------------------------

const brutalistTheme: ThemeDefinition = {
  name: "Brutalist",
  colorMode: "dark-only",
  light: {
    background: "oklch(0 0 0)",
    foreground: "oklch(0.95 0 0)",
    card: "oklch(0.07 0 0)",
    cardForeground: "oklch(0.95 0 0)",
    popover: "oklch(0.07 0 0)",
    popoverForeground: "oklch(0.95 0 0)",
    primary: "oklch(0.55 0.214 259.815)",
    primaryForeground: "oklch(1 0 0)",
    secondary: "oklch(0.12 0 0)",
    secondaryForeground: "oklch(0.85 0 0)",
    muted: "oklch(0.15 0 0)",
    mutedForeground: "oklch(0.45 0 0)",
    accent: "oklch(0.1 0 0)",
    accentForeground: "oklch(0.95 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    destructiveForeground: "oklch(0.985 0 0)",
    border: "oklch(0.22 0 0)",
    input: "oklch(0.22 0 0)",
    ring: "oklch(0.55 0.214 259.815)",
    radius: "0",
    chart1: "oklch(0.488 0.243 264.376)",
    chart2: "oklch(0.696 0.17 162.48)",
    chart3: "oklch(0.769 0.188 70.08)",
    chart4: "oklch(0.627 0.265 303.9)",
    chart5: "oklch(0.645 0.246 16.439)",
    sidebar: "oklch(0.05 0 0)",
    sidebarForeground: "oklch(0.95 0 0)",
    sidebarPrimary: "oklch(0.55 0.214 259.815)",
    sidebarPrimaryForeground: "oklch(1 0 0)",
    sidebarAccent: "oklch(0.1 0 0)",
    sidebarAccentForeground: "oklch(0.95 0 0)",
    sidebarBorder: "oklch(0.22 0 0)",
    sidebarRing: "oklch(0.55 0.214 259.815)",
    codeBg: "oklch(0.12 0 0)",
    codeFg: "oklch(0.8 0 0)",
    codeBorder: "oklch(0.22 0 0)",
  },
  bodyFont: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
  codeFont: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
  fonts: [
    {
      href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&family=Sora:wght@400;600;700&display=swap",
    },
  ],
  extraCss: [
    "::selection { background: oklch(0.55 0.214 259.815 / 0.3); }",
    ".grid-pattern { background-image: linear-gradient(oklch(0.15 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.15 0 0) 1px, transparent 1px); background-size: 60px 60px; }",
    ".dot-pattern { background-image: radial-gradient(circle, oklch(0.2 0 0) 1px, transparent 1px); background-size: 32px 32px; }",
    ".section-divider { height: 1px; background: linear-gradient(90deg, transparent, oklch(0.25 0 0), oklch(0.25 0 0), transparent); }",
    ".terminal-window { border: 1px solid oklch(0.22 0 0); background: oklch(0.04 0 0); }",
    ".terminal-window-header { border-bottom: 1px solid oklch(0.18 0 0); background: oklch(0.06 0 0); padding: 8px 12px; display: flex; align-items: center; gap: 6px; }",
    ".terminal-dot { width: 8px; height: 8px; border-radius: 50%; background: oklch(0.25 0 0); }",
  ].join("\n"),
}

// ---------------------------------------------------------------------------
// Theme registry
// ---------------------------------------------------------------------------

const themes: Record<ThemeName, ThemeDefinition> = {
  default: defaultTheme,
  brutalist: brutalistTheme,
}

export function getTheme(name: ThemeName): ThemeDefinition {
  return themes[name]
}

// ---------------------------------------------------------------------------
// CSS generation — converts a ThemeDefinition into a CSS string for injection
// ---------------------------------------------------------------------------

function tokensToCss(tokens: ThemeTokens): string {
  return [
    `--background: ${tokens.background}`,
    `--foreground: ${tokens.foreground}`,
    `--card: ${tokens.card}`,
    `--card-foreground: ${tokens.cardForeground}`,
    `--popover: ${tokens.popover}`,
    `--popover-foreground: ${tokens.popoverForeground}`,
    `--primary: ${tokens.primary}`,
    `--primary-foreground: ${tokens.primaryForeground}`,
    `--secondary: ${tokens.secondary}`,
    `--secondary-foreground: ${tokens.secondaryForeground}`,
    `--muted: ${tokens.muted}`,
    `--muted-foreground: ${tokens.mutedForeground}`,
    `--accent: ${tokens.accent}`,
    `--accent-foreground: ${tokens.accentForeground}`,
    `--destructive: ${tokens.destructive}`,
    `--destructive-foreground: ${tokens.destructiveForeground}`,
    `--border: ${tokens.border}`,
    `--input: ${tokens.input}`,
    `--ring: ${tokens.ring}`,
    `--radius: ${tokens.radius}`,
    `--chart-1: ${tokens.chart1}`,
    `--chart-2: ${tokens.chart2}`,
    `--chart-3: ${tokens.chart3}`,
    `--chart-4: ${tokens.chart4}`,
    `--chart-5: ${tokens.chart5}`,
    `--sidebar: ${tokens.sidebar}`,
    `--sidebar-foreground: ${tokens.sidebarForeground}`,
    `--sidebar-primary: ${tokens.sidebarPrimary}`,
    `--sidebar-primary-foreground: ${tokens.sidebarPrimaryForeground}`,
    `--sidebar-accent: ${tokens.sidebarAccent}`,
    `--sidebar-accent-foreground: ${tokens.sidebarAccentForeground}`,
    `--sidebar-border: ${tokens.sidebarBorder}`,
    `--sidebar-ring: ${tokens.sidebarRing}`,
    `--code-bg: ${tokens.codeBg}`,
    `--code-fg: ${tokens.codeFg}`,
    `--code-border: ${tokens.codeBorder}`,
  ].join("; ")
}

export function generateThemeCss(theme: ThemeDefinition): string {
  const parts: string[] = []

  const fontVars = `--font-body: ${theme.bodyFont}; --font-code: ${theme.codeFont}`

  if (theme.colorMode === "dark-only") {
    // Output under :root, .dark to override both globals.css :root and .dark
    parts.push(`:root, .dark { ${tokensToCss(theme.light)}; ${fontVars} }`)
  } else {
    parts.push(`:root { ${tokensToCss(theme.light)}; ${fontVars} }`)
    if (theme.dark) {
      parts.push(`.dark { ${tokensToCss(theme.dark)} }`)
    }
  }

  if (theme.extraCss) {
    parts.push(theme.extraCss)
  }

  return parts.join("\n")
}

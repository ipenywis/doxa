import type { IconType } from "react-icons";
import {
  LuAlignJustify,
  LuArrowUpRight,
  LuBeaker,
  LuBook,
  LuBookOpen,
  LuBox,
  LuCircleHelp,
  LuCode,
  LuCog,
  LuCompass,
  LuDatabase,
  LuFile,
  LuFlag,
  LuFolder,
  LuGlobe,
  LuHouse,
  LuKey,
  LuLayers,
  LuList,
  LuPackage,
  LuPlay,
  LuPlug,
  LuRocket,
  LuSearch,
  LuServer,
  LuSettings,
  LuShield,
  LuTerminal,
  LuWrench,
  LuZap,
} from "react-icons/lu";

export const iconMap = {
  alignJustify: LuAlignJustify,
  arrowUpRight: LuArrowUpRight,
  beaker: LuBeaker,
  book: LuBook,
  bookOpen: LuBookOpen,
  box: LuBox,
  circleHelp: LuCircleHelp,
  code: LuCode,
  cog: LuCog,
  compass: LuCompass,
  database: LuDatabase,
  file: LuFile,
  flag: LuFlag,
  folder: LuFolder,
  globe: LuGlobe,
  house: LuHouse,
  key: LuKey,
  layers: LuLayers,
  list: LuList,
  package: LuPackage,
  play: LuPlay,
  plug: LuPlug,
  rocket: LuRocket,
  search: LuSearch,
  server: LuServer,
  settings: LuSettings,
  shield: LuShield,
  terminal: LuTerminal,
  wrench: LuWrench,
  zap: LuZap,
} satisfies Record<string, IconType>;

export type IconName = keyof typeof iconMap;

export interface IconOption {
  label: string;
  description: string;
  keywords: readonly string[];
}

export const iconOptions = {
  alignJustify: {
    label: "Text layout",
    description:
      "Use for navigation, page layout, formatting, menus, or structured text.",
    keywords: ["navigation", "layout", "formatting", "menu", "text", "sidebar"],
  },
  arrowUpRight: {
    label: "External link",
    description:
      "Use for outbound links, redirects, external resources, or handoffs.",
    keywords: ["external", "link", "redirect", "open", "outbound"],
  },
  beaker: {
    label: "Experiment",
    description:
      "Use for testing, experiments, labs, validation, previews, or advanced examples.",
    keywords: ["test", "testing", "experiment", "lab", "preview", "validation"],
  },
  book: {
    label: "Documentation",
    description:
      "Use for general docs, guides, manuals, or written references.",
    keywords: ["documentation", "docs", "guide", "manual", "reference"],
  },
  bookOpen: {
    label: "Learning",
    description:
      "Use for tutorials, learning paths, concepts, introductions, or educational pages.",
    keywords: ["learn", "tutorial", "concept", "introduction", "education"],
  },
  box: {
    label: "Component",
    description:
      "Use for components, packages, modules, building blocks, or bundled assets.",
    keywords: ["component", "package", "module", "asset", "block"],
  },
  circleHelp: {
    label: "Help",
    description:
      "Use for troubleshooting, FAQs, support, errors, or help pages.",
    keywords: ["help", "faq", "troubleshooting", "support", "error", "issue"],
  },
  code: {
    label: "Code",
    description:
      "Use for code examples, SDKs, APIs, source files, or programming references.",
    keywords: ["code", "sdk", "api", "source", "programming", "snippet"],
  },
  cog: {
    label: "Configuration",
    description:
      "Use for configuration files, options, settings, preferences, or setup knobs.",
    keywords: ["configuration", "config", "options", "preferences", "settings"],
  },
  compass: {
    label: "Overview",
    description:
      "Use for overview, orientation, introduction, roadmap, or where-to-start pages.",
    keywords: ["overview", "orientation", "introduction", "start", "roadmap"],
  },
  database: {
    label: "Data",
    description:
      "Use for databases, storage, content sources, indexes, persistence, or datasets.",
    keywords: [
      "database",
      "data",
      "storage",
      "content",
      "index",
      "persistence",
    ],
  },
  file: {
    label: "File",
    description:
      "Use for markdown, files, documents, single pages, or generic written content.",
    keywords: ["file", "markdown", "document", "page", "content"],
  },
  flag: {
    label: "Release",
    description:
      "Use for releases, milestones, goals, status, roadmaps, or launch steps.",
    keywords: ["release", "milestone", "goal", "status", "launch", "roadmap"],
  },
  folder: {
    label: "Project structure",
    description:
      "Use for folder layouts, project structure, organization, or file trees.",
    keywords: [
      "folder",
      "structure",
      "directory",
      "project",
      "organization",
      "tree",
    ],
  },
  globe: {
    label: "Web",
    description:
      "Use for websites, deployment targets, hosting, networked services, or global settings.",
    keywords: ["web", "website", "hosting", "network", "global", "internet"],
  },
  house: {
    label: "Home",
    description: "Use for home, landing, main entry, dashboard, or root pages.",
    keywords: ["home", "landing", "root", "dashboard", "main"],
  },
  key: {
    label: "Authentication",
    description:
      "Use for authentication, authorization, secrets, API keys, tokens, or credentials.",
    keywords: [
      "auth",
      "authentication",
      "authorization",
      "secret",
      "token",
      "credential",
      "key",
    ],
  },
  layers: {
    label: "Architecture",
    description:
      "Use for architecture, systems, layers, stacks, composition, or multi-part flows.",
    keywords: [
      "architecture",
      "system",
      "layers",
      "stack",
      "composition",
      "flow",
    ],
  },
  list: {
    label: "Reference list",
    description:
      "Use for lists, navigation references, indexes, catalogs, or ordered collections.",
    keywords: [
      "list",
      "reference",
      "index",
      "catalog",
      "collection",
      "navigation",
    ],
  },
  package: {
    label: "Package",
    description:
      "Use for installation, packages, dependencies, releases, or distribution.",
    keywords: [
      "package",
      "install",
      "installation",
      "dependency",
      "distribution",
      "release",
    ],
  },
  play: {
    label: "Quickstart",
    description:
      "Use for quickstarts, running commands, first steps, demos, or getting started.",
    keywords: [
      "quickstart",
      "run",
      "demo",
      "start",
      "getting started",
      "first steps",
    ],
  },
  plug: {
    label: "Integration",
    description:
      "Use for integrations, plugins, adapters, connectors, providers, or extensions.",
    keywords: [
      "integration",
      "plugin",
      "adapter",
      "connector",
      "provider",
      "extension",
    ],
  },
  rocket: {
    label: "Launch",
    description:
      "Use for setup, launch, onboarding, deployment starts, or fast first success.",
    keywords: [
      "launch",
      "setup",
      "onboarding",
      "quickstart",
      "deploy",
      "start",
    ],
  },
  search: {
    label: "Search",
    description:
      "Use for search, discovery, indexing, filtering, or lookup pages.",
    keywords: ["search", "discovery", "index", "filter", "lookup", "find"],
  },
  server: {
    label: "Server",
    description:
      "Use for servers, APIs, backend services, deployment, hosting, or infrastructure.",
    keywords: [
      "server",
      "backend",
      "api",
      "deployment",
      "hosting",
      "infrastructure",
    ],
  },
  settings: {
    label: "Settings",
    description:
      "Use for customization, preferences, theme settings, feature flags, or controls.",
    keywords: [
      "settings",
      "customization",
      "theme",
      "preferences",
      "controls",
      "feature flags",
    ],
  },
  shield: {
    label: "Security",
    description:
      "Use for security, privacy, permissions, safeguards, policy, or protection.",
    keywords: [
      "security",
      "privacy",
      "permissions",
      "policy",
      "protection",
      "safe",
    ],
  },
  terminal: {
    label: "CLI",
    description:
      "Use for CLI commands, terminals, shells, scripts, command references, or developer tools.",
    keywords: ["cli", "terminal", "shell", "command", "script", "tool"],
  },
  wrench: {
    label: "Development",
    description:
      "Use for development, maintenance, contributing, debugging, or operational tools.",
    keywords: [
      "development",
      "maintenance",
      "contributing",
      "debugging",
      "tool",
      "operations",
    ],
  },
  zap: {
    label: "Automation",
    description:
      "Use for AI, automation, performance, real-time features, or powerful shortcuts.",
    keywords: [
      "ai",
      "automation",
      "performance",
      "realtime",
      "shortcut",
      "fast",
    ],
  },
} satisfies Record<IconName, IconOption>;

export function getIcon(name?: string | null): IconType | null {
  if (!name) return null;
  return (iconMap as Record<string, IconType>)[name] ?? null;
}

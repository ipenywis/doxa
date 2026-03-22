import { PageRoutes } from "@/src/lib/pageroutes"

export const Navigations = [
  {
    title: "Docs",
    href: `/docs${PageRoutes[0]?.href ?? ""}`,
  },
]

export const GitHubLink = {
  href: "",
}

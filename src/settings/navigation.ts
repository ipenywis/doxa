import { PageRoutes } from "@/src/lib/pageroutes";

export interface NavItem {
  title: string;
  href: string;
  external?: boolean;
}

export const Navigations: NavItem[] = [
  {
    title: "Docs",
    href: `/docs${PageRoutes[0]?.href ?? ""}`,
  },
];

export const GitHubLink = {
  href: "",
};

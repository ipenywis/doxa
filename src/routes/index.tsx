import { createFileRoute } from "@tanstack/react-router";
import { LuArrowRight, LuGithub } from "react-icons/lu";

import { Settings } from "@/src/settings/main";
import { GitHubLink } from "@/src/settings/navigation";
import { PageRoutes } from "@/src/lib/pageroutes";
import { Link } from "@/src/lib/transition";
import { buttonVariants } from "@/src/components/ui/button";
import { Logo } from "@/src/components/navigation/logo";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    links: [{ rel: "canonical", href: Settings.site.url }],
  }),
});

function Home() {
  return (
    <main className="flex min-h-[88vh] flex-col items-center justify-center px-4">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <div className="mb-8">
          <Logo
            variant="full"
            size={48}
            as="h1"
            className="gap-3 text-5xl lg:text-7xl"
          />
        </div>

        <p className="mb-4 text-lg text-muted-foreground sm:text-xl">
          Beautiful, fast documentation that stays out of your way.
        </p>

        <p className="mb-10 text-sm text-muted-foreground/70">
          Built for developers who care about the reading experience as much as
          the writing.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href={`/docs${PageRoutes[0]?.href || ""}`}
            className={buttonVariants({
              className: "min-w-[160px] gap-2 text-base",
              size: "lg",
            })}
          >
            Get Started
            <LuArrowRight className="h-4 w-4" />
          </Link>
          {GitHubLink.href && (
            <a
              href={GitHubLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                className: "min-w-[160px] gap-2 text-base",
                size: "lg",
              })}
            >
              <LuGithub className="h-4 w-4" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </main>
  );
}

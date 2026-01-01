import { buttonVariants } from "@/src/components/ui/button"
import { PageRoutes } from "@/src/lib/pageroutes"
import { Link } from "@/src/lib/transition"
import { GitHubLink } from "@/src/settings/navigation"
import { createFileRoute } from "@tanstack/react-router"

import { Settings } from "@/src/types/settings"

export const Route = createFileRoute("/")({
  component: Home,
})

function Home() {
  return (
    <main className="flex min-h-[88vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-3xl">
        <h1 className="mb-6 text-4xl leading-tight font-bold lg:text-6xl">
          {Settings.title}
        </h1>
        <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
          {Settings.description}
        </p>
        <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
          <Link
            href={`/docs${PageRoutes[0]?.href || ""}`}
            className={buttonVariants({
              className: "w-full min-w-[150px] text-base sm:w-auto",
              size: "lg",
            })}
          >
            Get Started
          </Link>
          {GitHubLink.href && (
            <a
              href={GitHubLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                className: "w-full min-w-[150px] text-base sm:w-auto",
                size: "lg",
              })}
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </main>
  )
}

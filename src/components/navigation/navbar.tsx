import Anchor from "@/src/components/anchor"
import { Logo } from "@/src/components/navigation/logo"
import Search from "@/src/components/navigation/search"
import { SheetLeft } from "@/src/components/sidebar"
import { ModeToggle } from "@/src/components/theme-toggle"
import { buttonVariants } from "@/src/components/ui/button"
import { SheetClose } from "@/src/components/ui/sheet"
import { Link } from "@/src/lib/transition"
import { GitHubLink, Navigations } from "@/src/settings/navigation"
import { LuArrowUpRight, LuGithub } from "react-icons/lu"

export function Navbar() {
  return (
    <nav className="bg-opacity-5 sticky top-0 z-50 mx-auto flex h-16 w-full items-center justify-between border-b p-1 px-2 backdrop-blur-xl backdrop-filter sm:p-3 md:gap-2 md:px-4">
      <div className="flex items-center gap-5">
        <SheetLeft />
        <div className="flex items-center gap-6">
          <div className="hidden md:flex">
            <Logo />
          </div>
          <div className="hidden items-center gap-5 text-sm font-medium text-muted-foreground md:flex">
            <NavMenu />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Search />
        <div className="flex gap-2 sm:ml-0">
          {GitHubLink.href && (
            <a
              href={GitHubLink.href}
              className={buttonVariants({ variant: "outline", size: "icon" })}
              target="_blank"
              rel="noopener noreferrer"
              title="View the repository on GitHub"
              aria-label="View the repository on GitHub"
            >
              <LuGithub className="h-[1.1rem] w-[1.1rem]" />
            </a>
          )}
          <ModeToggle />
        </div>
      </div>
    </nav>
  )
}

export function NavMenu({ isSheet = false }) {
  return (
    <>
      {Navigations.map((item) => {
        const Comp = (
          <Anchor
            key={item.title + item.href}
            absolute
            activeClassName="font-bold text-primary"
            className="flex items-center gap-1 text-sm"
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
          >
            {item.title}{" "}
            {item.external && (
              <LuArrowUpRight className="h-3 w-3 align-super" strokeWidth={3} />
            )}
          </Anchor>
        )
        return isSheet ? (
          <SheetClose key={item.title + item.href} asChild>
            {Comp}
          </SheetClose>
        ) : (
          Comp
        )
      })}
    </>
  )
}

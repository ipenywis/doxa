import { Logo } from "@/src/components/navigation/logo"
import { Settings } from "@/src/types/settings"

export function Footer() {
  return (
    <footer className="flex h-32 w-full flex-wrap items-center justify-center gap-4 border-t px-2 py-3 text-sm text-foreground sm:justify-between sm:gap-0 sm:px-4 sm:py-0 lg:px-8">
      <p className="items-center">
        &copy; {new Date().getFullYear()}{" "}
        <a
          title={Settings.name}
          aria-label={Settings.name}
          className="font-semibold"
          href={Settings.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {Settings.name}
        </a>
        .
      </p>
      {Settings.branding !== false && (
        <div className="hidden items-center md:block">
          <Logo variant="full" size={16} />
        </div>
      )}
    </footer>
  )
}

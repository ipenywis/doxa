import { Logo } from "@/src/components/navigation/logo"
import { Settings } from "@/src/settings/main"

export function Footer() {
  return (
    <footer className="flex h-32 w-full flex-wrap items-center justify-center gap-4 border-t px-2 py-3 text-sm text-foreground sm:justify-between sm:gap-0 sm:px-4 sm:py-0 lg:px-8">
      <p className="items-center">
        &copy; {new Date().getFullYear()}{" "}
        <a
          title={Settings.company.name}
          aria-label={Settings.company.name}
          className="font-semibold"
          href={Settings.company.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {Settings.company.name}
        </a>
        .
      </p>
      {Settings.features.branding !== false && (
        <div className="hidden items-center md:block">
          <Logo variant="full" size={16} />
        </div>
      )}
    </footer>
  )
}

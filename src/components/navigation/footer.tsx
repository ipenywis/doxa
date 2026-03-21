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
          <a
            className="font-semibold"
            href="https://rubixstudios.com.au"
            title="Rubix Studios"
            aria-label="Rubix Studios"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/logo.svg"
              alt="Rubix Studios logo"
              title="Rubix Studios logo"
              aria-label="Rubix Studios logo"
              width={30}
              height={30}
            />
          </a>
        </div>
      )}
    </footer>
  )
}

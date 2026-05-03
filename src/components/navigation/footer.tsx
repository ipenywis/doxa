import { FaGithub } from "react-icons/fa6";

import { Settings } from "@/src/settings/main";
import { Logo } from "@/src/components/navigation/logo";

const openSourceRepoUrl = import.meta.env.VITE_OPENSOURCE_REPO_URL;

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
      {openSourceRepoUrl && (
        <a
          href={openSourceRepoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Free and Open Source on GitHub"
        >
          Free and OpenSource
          <FaGithub className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
      {Settings.features.branding !== false && (
        <div className="hidden items-center md:block">
          <Logo variant="full" size={16} />
        </div>
      )}
    </footer>
  );
}

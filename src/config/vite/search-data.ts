import { spawn } from "node:child_process";
import path from "node:path";

import type { PluginOption } from "vite";

const SOURCE_PATTERNS = [
  /[\\/]src[\\/]contents[\\/]docs[\\/].*\.mdx?$/,
  /[\\/]src[\\/]contents[\\/]settings[\\/]documents.*\.json$/,
  /[\\/]src[\\/]contents[\\/]settings[\\/]sections\.json$/,
];

/**
 * Keeps public/search-data in sync with docs and navigation changes.
 *
 * The content script uses tsconfig path aliases, but vite.config.ts is loaded
 * before vite-tsconfig-paths runs, so executing it through tsx preserves the
 * script's normal module resolution.
 */
export function searchDataPlugin(): PluginOption {
  let pending: NodeJS.Timeout | null = null;
  let inFlight: Promise<void> | null = null;

  async function rebuild(reason: string): Promise<void> {
    if (inFlight) return inFlight;

    inFlight = new Promise<void>((resolve) => {
      const tsxBin = path.join(process.cwd(), "node_modules", ".bin", "tsx");
      const proc = spawn(tsxBin, ["src/scripts/content.ts"], {
        cwd: process.cwd(),
        stdio: ["ignore", "inherit", "inherit"],
      });

      proc.on("close", (code) => {
        if (code === 0) {
          console.log(`[search-data] rebuilt (${reason})`);
        } else {
          console.error(
            `[search-data] rebuild failed (exit ${code}, ${reason})`
          );
        }

        inFlight = null;
        resolve();
      });

      proc.on("error", (err) => {
        console.error("[search-data] rebuild failed to start:", err);
        inFlight = null;
        resolve();
      });
    });

    return inFlight;
  }

  function scheduleRebuild(reason: string): void {
    if (pending) clearTimeout(pending);

    pending = setTimeout(() => {
      pending = null;
      void rebuild(reason);
    }, 150);
  }

  function isWatchedSource(file: string): boolean {
    return SOURCE_PATTERNS.some((pattern) => pattern.test(file));
  }

  return {
    name: "doxa:search-data",
    async buildStart() {
      await rebuild("build start");
    },
    configureServer(server) {
      const handler = (file: string) => {
        if (!isWatchedSource(file)) return;

        scheduleRebuild(`change ${path.relative(process.cwd(), file)}`);
      };

      server.watcher.on("add", handler);
      server.watcher.on("change", handler);
      server.watcher.on("unlink", handler);
    },
  };
}

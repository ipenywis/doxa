/* eslint-disable */
import { use, useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";

import { startViewTransitionIfSupported } from "@/src/lib/transition/document-view-transition";

import { useHash } from "./use-hash";

const suspenseBoundaries = new Set<string>();
let suspenseResolve: (() => void) | null = null;

export function useBrowserNativeTransitions() {
  const location = useLocation();
  const pathname = location.pathname;
  const currentPathname = useRef(pathname);

  const [currentViewTransition, setCurrentViewTransition] = useState<
    [Promise<void>, () => void] | null
  >(null);

  useEffect(() => {
    if (!("startViewTransition" in document)) {
      return;
    }

    const onPopState = () => {
      let pendingViewTransitionResolve: () => void;

      const pendingViewTransition = new Promise<void>((resolve) => {
        pendingViewTransitionResolve = resolve;
      });

      const pendingStartViewTransition = new Promise<void>((resolve) => {
        startViewTransitionIfSupported(() => {
          resolve();
          return pendingViewTransition;
        });
      });

      setCurrentViewTransition([
        pendingStartViewTransition,
        pendingViewTransitionResolve!,
      ]);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  if (currentViewTransition && currentPathname.current !== pathname) {
    use(currentViewTransition[0]);
  }

  const transitionRef = useRef(currentViewTransition);
  useEffect(() => {
    transitionRef.current = currentViewTransition;
  }, [currentViewTransition]);

  const hash = useHash();

  useEffect(() => {
    const finishTransition = async () => {
      currentPathname.current = pathname;
      if (transitionRef.current) {
        if (suspenseBoundaries.size > 0) {
          await new Promise<void>((resolve) => {
            suspenseResolve = resolve;
          });
        }

        transitionRef.current[1]();
        transitionRef.current = null;
      }
    };

    finishTransition();
  }, [hash, pathname]);
}

export function useTrackSuspense(id: string) {
  useEffect(() => {
    suspenseBoundaries.add(id);

    return () => {
      suspenseBoundaries.delete(id);
      if (suspenseBoundaries.size === 0 && suspenseResolve) {
        suspenseResolve();
        suspenseResolve = null;
      }
    };
  }, [id]);
}

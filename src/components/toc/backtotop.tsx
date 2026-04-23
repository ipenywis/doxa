import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { LuArrowUp } from "react-icons/lu";

function ScrollUp() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function BackToTop(): ReactElement {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function toggleVisible() {
      const { scrollTop } = document.documentElement;
      if (ref.current) {
        ref.current.classList.toggle("opacity-0", scrollTop < 300);
      }
    }

    window.addEventListener("scroll", toggleVisible);
    return () => {
      window.removeEventListener("scroll", toggleVisible);
    };
  }, []);

  return (
    <button
      ref={ref}
      onClick={ScrollUp}
      title="Scroll to top"
      aria-label="Scroll to top"
      type="button"
      className="flex cursor-pointer items-center gap-2 self-start text-sm text-muted-foreground opacity-0 transition-opacity duration-75 hover:text-foreground"
    >
      <LuArrowUp className="h-3.5 w-3.5" />
      <span>Back to top</span>
    </button>
  );
}

import type { ElementType } from "react";

import { PageRoutes } from "@/src/lib/pageroutes";
import { Link } from "@/src/lib/transition";

type LogoVariant = "full" | "icon";

interface LogoProps {
  variant?: LogoVariant;
  size?: number;
  className?: string;
  as?: ElementType;
}

const LOGO_ASPECT = 193 / 160;
const homeHref = PageRoutes[0]?.href ?? "/";

export function LogoMark({ size = 28 }: { size?: number }) {
  const height = size * LOGO_ASPECT;
  return (
    <span
      className="inline-block shrink-0"
      style={{ width: size, height }}
      aria-hidden="true"
    >
      <img
        src="/doxa-logo-new-dark.svg"
        alt=""
        width={size}
        height={height}
        className="block size-full dark:hidden"
        draggable={false}
      />
      <img
        src="/doxa-logo-new-light.svg"
        alt=""
        width={size}
        height={height}
        className="hidden size-full dark:block"
        draggable={false}
      />
    </span>
  );
}

export function Logo({
  variant = "full",
  size = 16,
  className,
  as: Tag = "span",
}: LogoProps) {
  if (variant === "icon") {
    return <LogoMark size={size} />;
  }

  return (
    <Link
      href={homeHref}
      title="doxa home"
      aria-label="doxa home"
      className={`flex items-center gap-1.5 ${className ?? ""}`}
    >
      <LogoMark size={size} />
      <Tag
        className="text-[1em] font-semibold text-foreground"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        doxa
      </Tag>
    </Link>
  );
}

import { ComponentProps } from "react";

import Copy from "@/src/components/markdown/copy";

export default function Pre({
  children,
  raw,
  ...rest
}: ComponentProps<"pre"> & { raw?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute top-2 right-2 z-10 sm:top-3 sm:right-2.5">
        <Copy content={raw!} />
      </div>
      <div className="relative">
        <pre {...rest}>{children}</pre>
      </div>
    </div>
  );
}

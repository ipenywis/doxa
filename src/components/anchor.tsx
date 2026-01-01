"use client"

import { ComponentProps } from "react"
import { Link } from "@/src/lib/transition"
import { cn } from "@/src/lib/utils"
import { useLocation } from "@tanstack/react-router"

type AnchorProps = ComponentProps<typeof Link> & {
  absolute?: boolean
  activeClassName?: string
  disabled?: boolean
}

export default function Anchor({
  absolute,
  className = "",
  activeClassName = "",
  disabled,
  children,
  ...props
}: AnchorProps) {
  const location = useLocation()
  const path = location.pathname

  let isMatch = absolute
    ? props.href.toString().split("/")[1] == path.split("/")[1]
    : path === props.href

  if (props.href.toString().includes("http")) isMatch = false

  if (disabled)
    return <div className={cn(className, "cursor-not-allowed")}>{children}</div>

  return (
    <Link className={cn(className, isMatch && activeClassName)} {...props}>
      {children}
    </Link>
  )
}

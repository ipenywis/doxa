"use client"

import { lazy, Suspense, type ReactNode } from "react"

const FileTreeComponent = lazy(
  () => import("@/src/components/markdown/filetree/component")
)

interface FileTreeProps {
  children: ReactNode
}

export function FileTree(props: FileTreeProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FileTreeComponent {...props} />
    </Suspense>
  )
}

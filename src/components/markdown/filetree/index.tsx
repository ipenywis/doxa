"use client"

import { lazy, Suspense } from "react"

const FileTreeComponent = lazy(
  () => import("@/src/components/markdown/filetree/component")
)

export function FileTree(props: any) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FileTreeComponent {...props} />
    </Suspense>
  )
}

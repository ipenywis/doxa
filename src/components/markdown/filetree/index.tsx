import {
  lazy,
  Suspense,
  type ReactElement,
  type ReactNode,
} from "react"

const TreeLazy = lazy(
  () => import("@/src/components/markdown/filetree/component")
)
const FolderLazy = lazy(() =>
  import("@/src/components/markdown/filetree/component").then((m) => ({
    default: m.Folder,
  }))
)
const FileLazy = lazy(() =>
  import("@/src/components/markdown/filetree/component").then((m) => ({
    default: m.File,
  }))
)

interface FileTreeProps {
  children: ReactNode
}

interface FolderProps {
  name: string
  label?: ReactElement
  open?: boolean
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void
  children: ReactNode
}

interface FileProps {
  name: string
  label?: ReactElement
}

export function FileTree(props: FileTreeProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TreeLazy {...props} />
    </Suspense>
  )
}

export function Folder(props: FolderProps) {
  return (
    <Suspense fallback={null}>
      <FolderLazy {...props} />
    </Suspense>
  )
}

export function File(props: FileProps) {
  return (
    <Suspense fallback={null}>
      <FileLazy {...props} />
    </Suspense>
  )
}

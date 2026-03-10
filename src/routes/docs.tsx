import { Sidebar } from "@/src/components/sidebar"
import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
})

function DocsLayout() {
  return (
    <div className="flex items-start gap-8 lg:gap-12">
      <Sidebar />
      <div className="min-w-0 flex-1 pt-6">
        <Outlet />
      </div>
    </div>
  )
}

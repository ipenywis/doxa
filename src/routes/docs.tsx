import { createFileRoute, Outlet } from "@tanstack/react-router"

import { Sidebar } from "@/components/sidebar"

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
})

function DocsLayout() {
  return (
    <div className="flex items-start gap-10 pt-10">
      <Sidebar />
      <div className="flex-1 md:flex-6">
        <Outlet />
      </div>
    </div>
  )
}

import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SectionTabs } from "@/src/components/navigation/section-tabs";
import { Sidebar } from "@/src/components/sidebar";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  return (
    <div className="flex flex-col">
      <SectionTabs />
      <div className="flex items-start gap-4 md:gap-8 lg:gap-12">
        <Sidebar />
        <div className="min-w-0 flex-1 pt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

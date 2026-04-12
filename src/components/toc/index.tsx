import { TableAnchor, TableAnchorProps } from "@/src/components/toc/anchor"
import { BackToTop } from "@/src/components/toc/backtotop"
import Feedback from "@/src/components/toc/feedback"

import { Settings } from "@/src/settings/main"

interface TableProps {
  tocs: TableAnchorProps
  pathName: string
  frontmatter: { title: string }
}

export function TableOfContents({ tocs, pathName, frontmatter }: TableProps) {
  return (
    <>
      {Settings.features.rightSidebar && (
        <aside
          className="toc sticky top-24 hidden min-w-[200px] max-w-[220px] gap-4 pt-6 xl:flex xl:flex-col"
          aria-label="Table of contents"
        >
          {Settings.features.tableOfContents && <TableAnchor tocs={tocs.tocs} />}
          {Settings.features.feedbackEdit && (
            <Feedback slug={pathName} title={frontmatter.title} />
          )}
          {Settings.features.scrollToTop && <BackToTop />}
        </aside>
      )}
    </>
  )
}

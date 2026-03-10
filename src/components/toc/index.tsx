import { TableAnchor, TableAnchorProps } from "@/src/components/toc/anchor"
import { BackToTop } from "@/src/components/toc/backtotop"
import Feedback from "@/src/components/toc/feedback"

import { Settings } from "@/src/types/settings"

interface TableProps {
  tocs: TableAnchorProps
  pathName: string
  frontmatter: { title: string }
}

export function TableOfContents({ tocs, pathName, frontmatter }: TableProps) {
  return (
    <>
      {Settings.rightbar && (
        <aside
          className="toc sticky top-16 hidden h-[calc(100vh-4rem)] min-w-[200px] max-w-[220px] gap-4 pt-6 xl:flex xl:flex-col"
          aria-label="Table of contents"
        >
          {Settings.toc && <TableAnchor tocs={tocs.tocs} />}
          {Settings.feedback && (
            <Feedback slug={pathName} title={frontmatter.title} />
          )}
          {Settings.totop && <BackToTop />}
        </aside>
      )}
    </>
  )
}

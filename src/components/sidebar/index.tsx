import { Logo } from "@/src/components/navigation/logo"
import { NavMenu } from "@/src/components/navigation/navbar"
import { PageMenu } from "@/src/components/sidebar/pagemenu"
import { Button } from "@/src/components/ui/button"
import { DialogTitle } from "@/src/components/ui/dialog"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { Separator } from "@/src/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/src/components/ui/sheet"
import { LuAlignLeft } from "react-icons/lu"

export function Sidebar() {
  return (
    <aside
      className="sticky top-16 hidden h-[calc(100vh-4rem)] min-w-[240px] max-w-[240px] flex-col overflow-y-auto md:flex"
      aria-label="Page navigation"
    >
      <ScrollArea className="pr-3 pt-6">
        <PageMenu />
      </ScrollArea>
    </aside>
  )
}

export function SheetLeft() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex cursor-pointer md:hidden"
        >
          <LuAlignLeft className="size-6!" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full flex-col gap-0 px-0" side="left">
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <SheetHeader>
          <SheetClose asChild>
            <Logo />
          </SheetClose>
        </SheetHeader>
        <ScrollArea className="flex h-full flex-col overflow-y-auto">
          <div className="mx-0 mt-3 flex flex-col gap-2.5 px-5">
            <NavMenu isSheet />
            <Separator className="my-2" />
            <PageMenu isSheet />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

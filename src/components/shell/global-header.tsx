"use client"

import { SourceLink } from "@/components/shell/source-link"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export const GlobalHeader = ({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void
}) => {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        {onOpenSidebar ? (
          <Button
            variant="ghost"
            size="icon"
            className="-ml-1 text-muted-foreground md:hidden"
            onClick={onOpenSidebar}
            aria-label="Toggle menu"
          >
            <Menu />
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <SourceLink />
        <ThemeToggle />

        <div className="ml-1 border-l border-border pl-2">
          <UserMenu compact />
        </div>
      </div>
    </header>
  )
}

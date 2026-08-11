import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export const FilterToolbar = ({
  children,
  trailing,
  className,
}: {
  children?: ReactNode
  trailing?: ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border pb-3",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {trailing ? (
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {trailing}
        </div>
      ) : null}
    </div>
  )
}

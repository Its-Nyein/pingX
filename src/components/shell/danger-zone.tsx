import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export const DangerZone = ({
  title = "Danger zone",
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children?: ReactNode
  className?: string
}) => {
  return (
    <section
      className={cn(
        "rounded-md border border-destructive/30 bg-card",
        className
      )}
    >
      <div className="border-b border-destructive/20 px-4 py-3">
        <h2 className="text-lg font-semibold tracking-tight text-destructive">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="p-4">{children}</div>
    </section>
  )
}

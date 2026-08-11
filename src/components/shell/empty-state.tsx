import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  children?: ReactNode
  className?: string
}

export const EmptyState = ({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-border bg-card px-6 py-10 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-recessed">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      ) : null}

      <p className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </p>

      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}

      {children ? <div className="mt-4 w-full">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

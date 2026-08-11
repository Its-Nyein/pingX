import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface MetricPanelProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: LucideIcon
  className?: string
}

export const MetricPanel = ({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: MetricPanelProps) => {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
      </div>

      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
        {value}
      </p>

      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

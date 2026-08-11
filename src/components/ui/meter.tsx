import { cn } from "@/lib/utils"

interface MeterProps {
  label: string
  value: number
  max: number

  hint?: string
  className?: string
}

export const Meter = ({ label, value, max, hint, className }: MeterProps) => {
  const safeMax = max > 0 ? max : 1
  const pct = Math.min(100, Math.round((value / safeMax) * 100))

  const fill =
    pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-primary"

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {value.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-1.5 w-full overflow-hidden rounded-full bg-recessed"
      >
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-baseline justify-between gap-3">
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : (
          <span />
        )}
        <span className="text-xs tabular-nums text-muted-foreground">
          {pct}%
        </span>
      </div>
    </div>
  )
}

export const MeterSkeleton = ({ label }: { label: string }) => (
  <div className="space-y-1.5">
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="h-4 w-16 animate-pulse rounded bg-recessed" />
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-recessed" />
    <div className="flex justify-end">
      <span className="h-3 w-8 animate-pulse rounded bg-recessed" />
    </div>
  </div>
)

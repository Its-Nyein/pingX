"use client"

import { format } from "date-fns"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface SeriesPoint {
  bucket: string
  delivered: number
  failed: number
}

const AXIS = "var(--muted-foreground)"
const GRID = "var(--border)"

const TooltipCard = ({
  active,
  payload,
  label,
  bucket,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  bucket: "hour" | "day"
}) => {
  if (!active || !payload?.length) return null

  const total = payload.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-foreground">
        {label ? format(new Date(label), bucket === "hour" ? "HH:mm" : "d MMM") : ""}
      </p>

      <dl className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ background: entry.color }}
            />
            <dt className="text-muted-foreground">{entry.name}</dt>
            <dd className="ml-auto tabular-nums text-foreground">{entry.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-1.5 border-t border-border pt-1.5 text-xs text-muted-foreground">
        {total} total
      </p>
    </div>
  )
}

const Swatch = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
    <span
      aria-hidden
      className="size-2 rounded-[2px]"
      style={{ background: color }}
    />
    {label}
  </span>
)

export const EventChart = ({
  series,
  bucket,
}: {
  series: SeriesPoint[]
  bucket: "hour" | "day"
}) => {
  const total = series.reduce((sum, p) => sum + p.delivered + p.failed, 0)

  if (total === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-md border border-border bg-card">
        <p className="text-sm text-muted-foreground">
          No events in this range yet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        <h3 className="text-sm font-medium text-foreground">
          Delivery over time
        </h3>

        <div className="ml-auto flex items-center gap-3">
          <Swatch color="var(--chart-delivered)" label="Delivered" />
          <Swatch color="var(--chart-failed)" label="Failed" />
        </div>
      </div>

      <div className="mt-4 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />

            <XAxis
              dataKey="bucket"
              tickLine={false}
              axisLine={{ stroke: GRID }}
              tick={{ fill: AXIS, fontSize: 11 }}
              tickFormatter={(value: string) =>
                format(new Date(value), bucket === "hour" ? "HH:mm" : "d MMM")
              }
              minTickGap={24}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: AXIS, fontSize: 11 }}
              width={40}
            />

            <Tooltip
              cursor={{ fill: "var(--recessed)", opacity: 0.5 }}
              content={<TooltipCard bucket={bucket} />}
            />

            <Bar
              dataKey="delivered"
              name="Delivered"
              stackId="events"
              fill="var(--chart-delivered)"
              stroke="var(--card)"
              strokeWidth={2}
            />
            <Bar
              dataKey="failed"
              name="Failed"
              stackId="events"
              fill="var(--chart-failed)"
              stroke="var(--card)"
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

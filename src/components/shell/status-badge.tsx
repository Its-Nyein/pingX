import { Badge } from "@/components/ui/badge"
import type { Status } from "@/db"

const STATUS_VARIANT = {
  DELIVERED: "success",
  FAILED: "destructive",
  PENDING: "warning",
} as const satisfies Record<Status, "success" | "destructive" | "warning">

const STATUS_LABEL = {
  DELIVERED: "Delivered",
  FAILED: "Failed",
  PENDING: "Pending",
} as const satisfies Record<Status, string>

export const StatusBadge = ({ status }: { status: Status }) => (
  <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
)

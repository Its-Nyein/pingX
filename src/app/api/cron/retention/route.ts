import { db, events, users } from "@/db"
import { RETENTION } from "@/config"
import { createLogger, newRequestId } from "@/lib/logger"
import { cleanupCutoff } from "@/lib/retention"
import { and, eq, lt } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export const POST = async (req: NextRequest) => {
  const log = createLogger("retention", { requestId: newRequestId() })
  const secret = process.env.CRON_SECRET

  if (!secret) {
    log.error("CRON_SECRET is not set")
    return NextResponse.json(
      { message: "Retention cleanup is not configured" },
      { status: 503 }
    )
  }

  if (req.headers.get("Authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const plans = ["FREE", "PRO"] as const
  const deletedByPlan: Record<string, number> = {}

  for (const plan of plans) {
    const cutoff = cleanupCutoff(plan)

    const owners = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.plan, plan))

    let deleted = 0

    for (const owner of owners) {
      const rows = await db
        .delete(events)
        .where(and(eq(events.userId, owner.id), lt(events.createdAt, cutoff)))
        .returning({ id: events.id })

      deleted += rows.length
    }

    deletedByPlan[plan] = deleted
    log.info("swept plan", { plan, cutoff: cutoff.toISOString(), deleted })
  }

  return NextResponse.json({
    deleted: deletedByPlan,
    graceDays: RETENTION.graceDays,
  })
}

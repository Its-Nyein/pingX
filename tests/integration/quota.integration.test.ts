import { beforeEach, describe, expect, it } from "vitest"

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

const describeIfDb = TEST_DATABASE_URL ? describe : describe.skip

describeIfDb("quota rollover (integration)", () => {
  let db: typeof import("@/db").db
  let quotas: typeof import("@/db").quotas
  let users: typeof import("@/db").users
  let getOrRollQuota: typeof import("@/lib/quota").getOrRollQuota
  let incrementQuota: typeof import("@/lib/quota").incrementQuota
  let eq: typeof import("drizzle-orm").eq

  const USER_ID = "quota-int-test-user"
  const EMAIL = "quota-int-test@pingx.local"

  beforeEach(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL

    ;({ db, quotas, users } = await import("@/db"))
    ;({ getOrRollQuota, incrementQuota } = await import("@/lib/quota"))
    ;({ eq } = await import("drizzle-orm"))

    await db.delete(quotas).where(eq(quotas.userId, USER_ID))
    await db.delete(users).where(eq(users.id, USER_ID))

    await db.insert(users).values({
      id: USER_ID,
      name: "Quota Integration Test",
      email: EMAIL,
      apiKey: `quota-int-${Date.now()}`,
      plan: "FREE",
    })
  })

  it("starts at zero for a user with no quota row", async () => {
    const state = await getOrRollQuota(USER_ID, "FREE")

    expect(state.used).toBe(0)
    expect(state.limit).toBe(100)
  })

  it("increments within the same period", async () => {
    await incrementQuota(USER_ID)
    await incrementQuota(USER_ID)
    const third = await incrementQuota(USER_ID)

    expect(third.used).toBe(3)
    expect((await getOrRollQuota(USER_ID, "FREE")).used).toBe(3)
  })

  it("resets the count when the stored period has passed", async () => {
    await db.insert(quotas).values({
      userId: USER_ID,
      year: 2025,
      month: 1,
      count: 100,
      warned80: true,
    })

    const state = await getOrRollQuota(USER_ID, "FREE")

    expect(state.used).toBe(0)
    expect(state.warned80).toBe(false)

    const [row] = await db
      .select()
      .from(quotas)
      .where(eq(quotas.userId, USER_ID))
      .limit(1)

    expect(row.count).toBe(0)
    expect(row.year).toBe(new Date().getUTCFullYear())
  })

  it("resets on increment too, not only on read", async () => {
    await db.insert(quotas).values({
      userId: USER_ID,
      year: 2025,
      month: 12,
      count: 99,
      warned80: true,
    })

    const { used, warned80 } = await incrementQuota(USER_ID)

    expect(used).toBe(1)
    expect(warned80).toBe(false)
  })

  it("keeps the warning flag within the same period", async () => {
    await incrementQuota(USER_ID)
    await db.update(quotas).set({ warned80: true }).where(eq(quotas.userId, USER_ID))

    const { warned80 } = await incrementQuota(USER_ID)

    expect(warned80).toBe(true)
  })

  it("blocks once the count reaches the plan limit", async () => {
    const { year, month } = {
      year: new Date().getUTCFullYear(),
      month: new Date().getUTCMonth() + 1,
    }

    await db
      .insert(quotas)
      .values({ userId: USER_ID, year, month, count: 100, warned80: true })

    const state = await getOrRollQuota(USER_ID, "FREE")

    expect(state.used).toBeGreaterThanOrEqual(state.limit)
    expect(state.resetsAt.getTime()).toBeGreaterThan(Date.now())
  })

  it("gives a PRO user the higher limit against the same row", async () => {
    await incrementQuota(USER_ID)

    expect((await getOrRollQuota(USER_ID, "FREE")).limit).toBe(100)
    expect((await getOrRollQuota(USER_ID, "PRO")).limit).toBe(1000)
  })
})

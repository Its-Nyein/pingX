import superjson from "superjson"
import { beforeEach, describe, expect, it, vi } from "vitest"

const USER = {
  id: "user_1",
  plan: "FREE" as const,
  discordId: "123456789012345678",
}

const state = vi.hoisted(() => ({
  users: [] as Record<string, unknown>[],
  categories: [] as Record<string, unknown>[],
  inserted: [] as Record<string, unknown>[],
  updates: [] as Record<string, unknown>[],
  sendEmbed: vi.fn(),
  createDM: vi.fn(),
  incrementQuota: vi.fn(),
  consumeRateLimit: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("drizzle-orm")>()),
  eq: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
}))

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: state.getSession } },
}))

vi.mock("@/db", () => {
  const rowsFor = (table: { __table?: string }) =>
    table.__table === "users" ? state.users : state.categories

  return {
    db: {
      select: () => ({
        from: (table: { __table?: string }) => ({
          where: () => ({ limit: async () => rowsFor(table) }),
        }),
      }),
      insert: () => ({
        values: (row: Record<string, unknown>) => ({
          returning: async () => {
            const stored = { id: "evt_1", deliveryStatus: "PENDING", ...row }
            state.inserted.push(stored)
            return [stored]
          },
        }),
      }),
      update: () => ({
        set: (values: Record<string, unknown>) => ({
          where: async () => void state.updates.push(values),
        }),
      }),
    },
    users: { __table: "users" },
    events: { __table: "events" },
    eventCategories: { __table: "eventCategories" },
  }
})

vi.mock("@/lib/discord-client", () => ({
  DiscordClient: class {
    createDM = state.createDM
    sendEmbed = state.sendEmbed
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: state.consumeRateLimit,
}))

vi.mock("@/lib/quota", () => ({
  incrementQuota: state.incrementQuota,
  getOrRollQuota: vi.fn(),
  categoryLimitFor: vi.fn(() => 3),
  slotsRemaining: vi.fn(() => 3),
}))

const send = async (name = "sale") => {
  const { categoryRouter } = await import("@/server/routers/category-router")

  return categoryRouter.request("/sendTestEvent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: superjson.stringify(name) }),
  })
}

beforeEach(() => {
  state.users = [USER]
  state.categories = [{ id: "cat_1", name: "sale", userId: USER.id }]
  state.inserted = []
  state.updates = []
  state.getSession.mockReset().mockResolvedValue({ user: { id: USER.id } })
  state.createDM.mockReset().mockResolvedValue({ id: "dm_1" })
  state.sendEmbed.mockReset().mockResolvedValue(undefined)
  state.incrementQuota.mockReset()
  state.consumeRateLimit
    .mockReset()
    .mockResolvedValue({ allowed: true, count: 1, limit: 5, retryAfter: 60 })
  vi.clearAllMocks()
})

describe("sendTestEvent", () => {
  it("delivers through the injected channel", async () => {
    const res = await send()

    expect(res.status).toBe(200)
    expect(state.createDM).toHaveBeenCalledWith(USER.discordId)
    expect(state.sendEmbed).toHaveBeenCalledOnce()

    const [channelId, embed] = state.sendEmbed.mock.calls[0]
    expect(channelId).toBe("dm_1")
    expect(embed.title).toBe("Sale")
  })

  it("does not consume quota", async () => {
    await send()

    expect(state.incrementQuota).not.toHaveBeenCalled()
  })

  it("still works for a user already at their quota limit", async () => {
    const res = await send()

    expect(res.status).toBe(200)
    expect(state.incrementQuota).not.toHaveBeenCalled()
    expect(state.sendEmbed).toHaveBeenCalledOnce()
  })

  it("rejects cleanly when no Discord ID is set", async () => {
    state.users = [{ ...USER, discordId: null }]

    const res = await send()
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.message).toMatch(/Discord ID/)
    expect(state.inserted).toHaveLength(0)
    expect(state.sendEmbed).not.toHaveBeenCalled()
  })

  it("records lastError when delivery fails, like any other event", async () => {
    state.sendEmbed.mockRejectedValue(new Error("connection reset"))

    const res = await send()

    expect(res.status).toBe(502)
    expect(state.updates).toHaveLength(1)
    expect(state.updates[0]).toMatchObject({
      deliveryStatus: "FAILED",
      lastError: "connection reset",
    })
  })

  it("refuses past the rate limit", async () => {
    state.consumeRateLimit.mockResolvedValue({
      allowed: false,
      count: 6,
      limit: 5,
      retryAfter: 42,
    })

    const res = await send()
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.message).toMatch(/42s/)
    expect(state.inserted).toHaveLength(0)
  })

  it("404s for a category the caller does not own", async () => {
    state.categories = []

    const res = await send("nope")

    expect(res.status).toBe(404)
    expect(state.inserted).toHaveLength(0)
  })

  it("is a real Event row that goes through real status transitions", async () => {
    await send()

    expect(state.inserted).toHaveLength(1)
    expect(state.inserted[0]).toMatchObject({
      name: "sale",
      userId: USER.id,
      eventCategoryId: "cat_1",
      deliveryStatus: "PENDING",
    })
    expect(state.inserted[0].data).toMatchObject({ test: true })

    expect(state.updates).toHaveLength(1)
    expect(state.updates[0]).toMatchObject({
      deliveryStatus: "DELIVERED",
      lastError: null,
    })
    expect(state.updates[0].deliveredAt).toBeInstanceOf(Date)
  })

  it("does not 500 when Discord refuses the recipient", async () => {
    state.createDM.mockRejectedValue(
      Object.assign(new Error("Invalid Recipient(s)"), { status: 400, code: 50033 })
    )

    const res = await send()
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.message).toMatch(/does not recognise that user ID/)
    expect(state.sendEmbed).not.toHaveBeenCalled()
  })

  it("records why the DM could not be opened on the event row", async () => {
    state.createDM.mockRejectedValue(
      Object.assign(new Error("Invalid Recipient(s)"), { status: 400, code: 50033 })
    )

    await send()

    expect(state.updates).toHaveLength(1)
    expect(state.updates[0]).toMatchObject({ deliveryStatus: "FAILED" })
    expect(String(state.updates[0].lastError)).toMatch(/does not recognise/)
  })
})

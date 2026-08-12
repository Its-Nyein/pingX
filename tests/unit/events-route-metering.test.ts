import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  statusUpdates: [] as string[],
  sendEmbed: vi.fn(),
  incrementQuota: vi.fn(),
  user: {
    id: "user_1",
    plan: "FREE" as const,
    apiKey: "key_1",
    discordId: "123456789012345678",
    eventCategories: [{ id: "cat_1", name: "sale" }],
  },
}))

vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("drizzle-orm")>()),
  eq: vi.fn(() => ({})),
}))

vi.mock("@/db", () => ({
  db: {
    query: { users: { findFirst: vi.fn(async () => state.user) } },
    insert: vi.fn(() => ({
      values: () => ({ returning: async () => [{ id: "evt_1" }] }),
    })),
    update: vi.fn(() => ({
      set: (values: { deliveryStatus?: string }) => ({
        where: async () => {
          if (values.deliveryStatus) state.statusUpdates.push(values.deliveryStatus)
        },
      }),
    })),
  },
  events: { id: "id", deliveryStatus: "deliveryStatus" },
  users: { apiKey: "apiKey" },
}))

vi.mock("@/lib/discord-client", () => ({
  DiscordClient: class {
    createDM = async () => ({ id: "dm_1" })
    sendEmbed = state.sendEmbed
  },
}))

vi.mock("@/lib/quota", () => ({
  getOrRollQuota: vi.fn(async () => ({
    used: 0,
    limit: 100,
    year: 2026,
    month: 8,
    warned80: false,
    resetsAt: new Date("2026-09-01T00:00:00.000Z"),
  })),
  incrementQuota: state.incrementQuota,
  crossedWarnThreshold: vi.fn(() => false),
}))

vi.mock("@/lib/quota-warning", () => ({ sendQuotaWarning: vi.fn() }))

const post = async () => {
  const { POST } = await import("@/app/api/v1/events/route")

  const req = new Request("http://localhost/api/v1/events", {
    method: "POST",
    headers: {
      Authorization: "Bearer key_1",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ category: "sale", data: { plan: "PRO" } }),
  })

  return POST(req as never)
}

beforeEach(() => {
  state.statusUpdates = []
  state.sendEmbed.mockReset().mockResolvedValue(undefined)
  state.incrementQuota
    .mockReset()
    .mockResolvedValue({ used: 1, warned80: false })
  vi.clearAllMocks()
})

describe("POST /api/v1/events — delivery and metering are separate failure domains", () => {
  it("delivers, meters, and returns 200", async () => {
    const res = await post()

    expect(res.status).toBe(200)
    expect(state.statusUpdates).toEqual(["DELIVERED"])
    expect(state.incrementQuota).toHaveBeenCalledOnce()
  })

  it("still returns 200 with the event DELIVERED when metering throws afterwards", async () => {
    state.incrementQuota.mockRejectedValue(new Error("connection reset"))

    const res = await post()
    const body = await res.json()

    // The event genuinely reached Discord, so the caller must not be told it
    // failed and the row must not be relabelled.
    expect(res.status).toBe(200)
    expect(body.eventId).toBe("evt_1")
    expect(state.statusUpdates).toEqual(["DELIVERED"])
    expect(state.statusUpdates).not.toContain("FAILED")
  })

  it("marks FAILED and returns 500 when Discord delivery fails", async () => {
    state.sendEmbed.mockRejectedValue(new Error("discord 429"))

    const res = await post()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.eventId).toBe("evt_1")
    expect(state.statusUpdates).toEqual(["FAILED"])
  })

  it("does not consume quota when delivery fails", async () => {
    state.sendEmbed.mockRejectedValue(new Error("discord 429"))

    await post()

    expect(state.incrementQuota).not.toHaveBeenCalled()
  })
})

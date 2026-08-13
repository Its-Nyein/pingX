import { encodeCursor } from "@/lib/cursor"
import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  users: [{ id: "user_1" }] as { id: string }[],
  rows: [] as Record<string, unknown>[],
  limitArg: 0,
  consumeRateLimit: vi.fn(),
}))

vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("drizzle-orm")>()),
  eq: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
  sql: Object.assign(
    vi.fn(() => ({})),
    { raw: vi.fn(() => ({})) }
  ),
}))

vi.mock("@/db", () => ({
  db: {
    select: (projection?: Record<string, unknown>) => ({
      from: () => ({
        where: () => ({
          limit: async (n: number) => {
            state.limitArg = n
            return projection && "category" in projection ? state.rows : state.users
          },
          orderBy: () => ({
            limit: async (n: number) => {
              state.limitArg = n
              return state.rows
            },
          }),
        }),
      }),
    }),
  },
  events: {},
  users: {},
}))

vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: state.consumeRateLimit }))
vi.mock("@/lib/quota", () => ({
  getOrRollQuota: vi.fn(),
  incrementQuota: vi.fn(),
  crossedWarnThreshold: vi.fn(),
}))
vi.mock("@/lib/quota-warning", () => ({ sendQuotaWarning: vi.fn() }))
vi.mock("@/lib/discord-client", () => ({ DiscordClient: class {} }))

const event = (i: number) => ({
  id: `evt_${i}`,
  category: "sale",
  data: { plan: "PRO" },
  deliveryStatus: "DELIVERED",
  deliveredAt: new Date("2026-08-12T10:00:00.000Z"),
  lastError: null,
  createdAt: new Date(`2026-08-12T10:0${i}:00.000Z`),
})

const list = async (query = "") => {
  const { GET } = await import("@/app/api/v1/events/route")
  const url = `http://localhost/api/v1/events${query}`

  const req = Object.assign(
    new Request(url, { headers: { Authorization: "Bearer key_1" } }),
    { nextUrl: new URL(url) }
  )

  return GET(req as never)
}

beforeEach(() => {
  state.users = [{ id: "user_1" }]
  state.rows = []
  state.limitArg = 0
  state.consumeRateLimit
    .mockReset()
    .mockResolvedValue({ allowed: true, count: 1, limit: 60, retryAfter: 60 })
  vi.clearAllMocks()
})

describe("GET /api/v1/events", () => {
  it("returns the caller's events", async () => {
    state.rows = [event(1), event(2)]

    const res = await list()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.events).toHaveLength(2)
    expect(body.events[0].id).toBe("evt_1")
    expect(body.nextCursor).toBeNull()
  })

  it("requires an API key", async () => {
    const { GET } = await import("@/app/api/v1/events/route")
    const url = "http://localhost/api/v1/events"
    const req = Object.assign(new Request(url), { nextUrl: new URL(url) })

    expect((await GET(req as never)).status).toBe(401)
  })

  it("401s on an unknown key", async () => {
    state.users = []

    expect((await list()).status).toBe(401)
  })

  it("honours the rate limit", async () => {
    state.consumeRateLimit.mockResolvedValue({
      allowed: false,
      count: 61,
      limit: 60,
      retryAfter: 30,
    })

    const res = await list()

    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBe("30")
  })

  it("returns a cursor only when there is another page", async () => {
    state.rows = Array.from({ length: 3 }, (_, i) => event(i + 1))

    const res = await list("?limit=2")
    const body = await res.json()

    expect(state.limitArg).toBe(3)
    expect(body.events).toHaveLength(2)
    expect(body.nextCursor).toBeTruthy()
  })

  it("rejects a limit outside the allowed range", async () => {
    expect((await list("?limit=0")).status).toBe(422)
    expect((await list("?limit=500")).status).toBe(422)
  })

  it("rejects an unknown status", async () => {
    expect((await list("?status=NOPE")).status).toBe(422)
  })

  it("rejects a malformed cursor rather than ignoring it", async () => {
    const res = await list("?cursor=not-a-cursor!!")

    expect(res.status).toBe(400)
  })

  it("accepts a well-formed cursor", async () => {
    const cursor = encodeCursor({
      createdAt: new Date("2026-08-12T10:00:00.000Z"),
      id: "evt_1",
    })

    expect((await list(`?cursor=${cursor}`)).status).toBe(200)
  })
})

import superjson from "superjson"

import { DELETE_CONFIRMATION } from "@/config"
import { beforeEach, describe, expect, it, vi } from "vitest"

const USER = {
  id: "user_1",
  email: "Ada@Example.com",
  plan: "FREE" as const,
}

const state = vi.hoisted(() => ({
  users: [] as Record<string, unknown>[],
  deletes: [] as string[],
  getSession: vi.fn(),
}))

vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("drizzle-orm")>()),
  eq: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
  count: vi.fn(() => ({})),
}))

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: state.getSession } },
}))

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: (table: { __table?: string }) => ({
        where: () => ({
          limit: async () => (table.__table === "users" ? state.users : []),
        }),
      }),
    }),
    delete: (table: { __table?: string }) => ({
      where: async () => void state.deletes.push(table.__table ?? "unknown"),
    }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  },
  users: { __table: "users" },
  events: { __table: "events" },
  eventCategories: { __table: "eventCategories" },
}))

vi.mock("@/lib/quota", () => ({
  getOrRollQuota: vi.fn(),
  categoryLimitFor: vi.fn(() => 3),
  slotsRemaining: vi.fn(() => 3),
}))

const remove = async (confirmation: string) => {
  const { projectRouter } = await import("@/server/routers/project-router")

  return projectRouter.request("/deleteAccount", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmation: superjson.stringify(confirmation) }),
  })
}

beforeEach(() => {
  state.users = [USER]
  state.deletes = []
  state.getSession.mockReset().mockResolvedValue({ user: { id: USER.id } })
  vi.clearAllMocks()
})

describe("deleteAccount", () => {
  it("deletes the user, which cascades to everything they own", async () => {
    const res = await remove(DELETE_CONFIRMATION)

    expect(res.status).toBe(200)
    expect(state.deletes).toEqual(["users"])
  })

  it("accepts any casing, so a phone keyboard does not block the delete", async () => {
    const res = await remove("confirm")

    expect(res.status).toBe(200)
    expect(state.deletes).toEqual(["users"])
  })

  it("ignores surrounding whitespace from a paste", async () => {
    const res = await remove("  Confirm  ")

    expect(res.status).toBe(200)
    expect(state.deletes).toEqual(["users"])
  })

  it("refuses anything else and deletes nothing", async () => {
    const res = await remove("delete")

    expect(res.status).toBe(400)
    expect(state.deletes).toEqual([])
  })

  it("refuses an empty confirmation and deletes nothing", async () => {
    const res = await remove("")

    expect(res.status).toBe(400)
    expect(state.deletes).toEqual([])
  })

  it("refuses when there is no session", async () => {
    state.getSession.mockResolvedValue(null)

    const res = await remove(DELETE_CONFIRMATION)

    expect(res.status).toBe(401)
    expect(state.deletes).toEqual([])
  })
})

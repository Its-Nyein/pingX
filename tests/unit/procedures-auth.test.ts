import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  rows: [] as { id: string; apiKey: string }[],
  getSession: vi.fn(),
}))

vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("drizzle-orm")>()),
  eq: vi.fn(() => ({})),
}))

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: state.getSession } },
}))

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => state.rows }),
      }),
    }),
  },
  users: { id: "id", apiKey: "apiKey" },
}))

const USER = { id: "user_1", apiKey: "key_1" }

const call = async (headers: Record<string, string> = {}) => {
  const { authMiddleware } = await import("@/server/procedures")

  const c = {
    req: {
      raw: { headers: new Headers(headers) },
      header: (name: string) => headers[name],
    },
  }

  const next = vi.fn(async (args: unknown) => args)

  return authMiddleware({ c: c as never, next: next as never, ctx: {} as never })
}

beforeEach(() => {
  state.rows = []
  state.getSession.mockReset().mockResolvedValue(null)
  vi.clearAllMocks()
})

describe("authMiddleware", () => {
  it("accepts a valid session and attaches the database row", async () => {
    state.getSession.mockResolvedValue({ user: { id: USER.id } })
    state.rows = [USER]

    await expect(call()).resolves.toEqual({ user: USER })
  })

  it("rejects a request with no session", async () => {
    await expect(call()).rejects.toMatchObject({ status: 401 })
  })

  it("does not accept an API key in place of a session", async () => {
    state.rows = [USER]

    await expect(
      call({ Authorization: `Bearer ${USER.apiKey}` })
    ).rejects.toMatchObject({ status: 401 })
  })

  it("does not consult the session lookup for a bearer token alone", async () => {
    state.getSession.mockResolvedValue(null)

    await expect(
      call({ Authorization: `Bearer ${USER.apiKey}` })
    ).rejects.toMatchObject({ status: 401 })

    expect(state.getSession).toHaveBeenCalledOnce()
  })

  it("rejects a session whose user row is gone", async () => {
    state.getSession.mockResolvedValue({ user: { id: "deleted" } })
    state.rows = []

    await expect(call()).rejects.toMatchObject({ status: 401 })
  })
})

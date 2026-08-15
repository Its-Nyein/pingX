import { PingX, PingXError } from "../../packages/pingx/src/index"
import { describe, expect, it, vi } from "vitest"

const ok = (body: unknown) =>
  vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  })

const fail = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: "Error",
    json: async () => body,
  })

const client = (fetchImpl: ReturnType<typeof ok>) =>
  new PingX({ apiKey: "key_1", baseUrl: "https://example.test", fetch: fetchImpl })

describe("PingX", () => {
  it("requires an API key", () => {
    expect(() => new PingX({ apiKey: "" })).toThrow(/apiKey is required/)
  })

  it("sends an event with bearer auth", async () => {
    const fetchImpl = ok({ message: "ok", eventId: "evt_1" })

    await client(fetchImpl).send("sale", { plan: "PRO" })

    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe("https://example.test/api/v1/events")
    expect(init.method).toBe("POST")
    expect(init.headers.Authorization).toBe("Bearer key_1")
    expect(JSON.parse(init.body)).toEqual({
      category: "sale",
      data: { plan: "PRO" },
      description: undefined,
    })
  })

  it("trims a trailing slash from baseUrl so the path is not doubled", async () => {
    const fetchImpl = ok({ message: "ok" })

    await new PingX({
      apiKey: "k",
      baseUrl: "https://example.test/",
      fetch: fetchImpl,
    }).send("sale")

    expect(fetchImpl.mock.calls[0][0]).toBe("https://example.test/api/v1/events")
  })

  it("builds a query string from list options, omitting undefined", async () => {
    const fetchImpl = ok({ events: [], nextCursor: null })

    await client(fetchImpl).list({ status: "FAILED", limit: 50 })

    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://example.test/api/v1/events?status=FAILED&limit=50"
    )
  })

  it("throws PingXError carrying the server's message and the eventId", async () => {
    const fetchImpl = fail(422, {
      message: "The recipient does not accept direct messages.",
      eventId: "evt_9",
    })

    await expect(client(fetchImpl).send("sale")).rejects.toMatchObject({
      name: "PingXError",
      status: 422,
      message: "The recipient does not accept direct messages.",
      eventId: "evt_9",
    })
  })

  it("marks rate limits and server errors retryable, refusals not", async () => {
    expect(new PingXError("x", 429).isRetryable).toBe(true)
    expect(new PingXError("x", 502).isRetryable).toBe(true)
    expect(new PingXError("x", 422).isRetryable).toBe(false)
    expect(new PingXError("x", 401).isRetryable).toBe(false)
  })

  it("paginates until the cursor runs out", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ events: [{ id: "a" }, { id: "b" }], nextCursor: "c1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ events: [{ id: "c" }], nextCursor: null }),
      })

    const seen: string[] = []
    for await (const event of client(fetchImpl).paginate({ category: "sale" })) {
      seen.push(event.id)
    }

    expect(seen).toEqual(["a", "b", "c"])
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(fetchImpl.mock.calls[1][0]).toContain("cursor=c1")
  })
})

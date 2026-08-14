import {
  deliver,
  describeFailure,
  isPermanent,
  openDirectMessage,
} from "@/lib/delivery"
import { describe, expect, it, vi } from "vitest"

const discordError = (status: number, code?: number) =>
  Object.assign(new Error("discord said no"), { status, ...(code ? { code } : {}) })

const EMBED = { title: "Sale" }
const AT = new Date("2026-08-12T10:00:00.000Z")

describe("isPermanent", () => {
  it("treats 4xx as permanent", () => {
    expect(isPermanent(discordError(403))).toBe(true)
    expect(isPermanent(discordError(404))).toBe(true)
    expect(isPermanent(discordError(400))).toBe(true)
  })

  it("treats 429 as transient, not permanent", () => {
    expect(isPermanent(discordError(429))).toBe(false)
  })

  it("treats 5xx as transient", () => {
    expect(isPermanent(discordError(500))).toBe(false)
    expect(isPermanent(discordError(503))).toBe(false)
  })

  it("treats an error with no status as transient", () => {
    expect(isPermanent(new Error("socket hang up"))).toBe(false)
    expect(isPermanent(null)).toBe(false)
    expect(isPermanent("boom")).toBe(false)
  })
})

describe("describeFailure", () => {
  it("explains the Discord codes a user can act on", () => {
    expect(describeFailure(discordError(403, 50007))).toMatch(
      /does not accept direct messages/
    )
    expect(describeFailure(discordError(403, 50001))).toMatch(/does not have access/)
    expect(describeFailure(discordError(404, 10013))).toMatch(/no longer exists/)
  })

  it("names rate limiting", () => {
    expect(describeFailure(discordError(429))).toMatch(/Rate limited/)
  })

  it("reports the status for a server-side failure", () => {
    expect(describeFailure(discordError(503))).toBe("Discord returned 503.")
  })

  it("falls back to the error message, then to a default", () => {
    expect(describeFailure(new Error("socket hang up"))).toBe("socket hang up")
    expect(describeFailure({})).toBe("Delivery failed for an unknown reason.")
  })
})

describe("deliver", () => {
  it("reports success with the time it happened", async () => {
    const transport = { sendEmbed: vi.fn().mockResolvedValue(undefined) }

    await expect(deliver(transport, "dm_1", EMBED, () => AT)).resolves.toEqual({
      delivered: true,
      at: AT,
    })

    expect(transport.sendEmbed).toHaveBeenCalledWith("dm_1", EMBED)
  })

  it("returns a reason and permanence rather than throwing", async () => {
    const transport = {
      sendEmbed: vi.fn().mockRejectedValue(discordError(403, 50007)),
    }

    await expect(deliver(transport, "dm_1", EMBED)).resolves.toEqual({
      delivered: false,
      permanent: true,
      reason:
        "The recipient does not accept direct messages from this server.",
    })
  })

  it("marks an exhausted rate limit as worth retrying", async () => {
    const transport = { sendEmbed: vi.fn().mockRejectedValue(discordError(429)) }
    const outcome = await deliver(transport, "dm_1", EMBED)

    expect(outcome).toMatchObject({ delivered: false, permanent: false })
  })
})

describe("openDirectMessage", () => {
  it("returns the channel when Discord opens one", async () => {
    const transport = { createDM: vi.fn().mockResolvedValue({ id: "dm_1" }) }

    await expect(openDirectMessage(transport, "123")).resolves.toEqual({
      opened: true,
      channelId: "dm_1",
    })
  })

  it("reports an invalid recipient rather than throwing", async () => {
    const transport = {
      createDM: vi.fn().mockRejectedValue(discordError(400, 50033)),
    }

    await expect(openDirectMessage(transport, "123")).resolves.toEqual({
      opened: false,
      permanent: true,
      reason: "Discord does not recognise that user ID. Check it in settings.",
    })
  })

  it("treats an unreachable Discord as worth retrying", async () => {
    const transport = {
      createDM: vi.fn().mockRejectedValue(discordError(503)),
    }

    await expect(openDirectMessage(transport, "123")).resolves.toMatchObject({
      opened: false,
      permanent: false,
    })
  })
})

import { messageFromErrorBody } from "@/lib/http-error"
import { describe, expect, it } from "vitest"

const FALLBACK = "Forbidden"

describe("messageFromErrorBody", () => {
  it("pulls the message out of an API error body", () => {
    const body = JSON.stringify({
      error: "Server Error",
      message:
        "You have reached the 3 category limit on the FREE plan. Delete a category or upgrade to add more.",
      type: "HTTPException",
    })

    expect(messageFromErrorBody(body, FALLBACK)).toBe(
      "You have reached the 3 category limit on the FREE plan. Delete a category or upgrade to add more."
    )
  })

  it("falls back when the body is not JSON", () => {
    expect(messageFromErrorBody("<html>502 Bad Gateway</html>", FALLBACK)).toBe(
      FALLBACK
    )
  })

  it("falls back on an empty body", () => {
    expect(messageFromErrorBody("", FALLBACK)).toBe(FALLBACK)
  })

  it("falls back when there is no message field", () => {
    expect(messageFromErrorBody(JSON.stringify({ error: "nope" }), FALLBACK)).toBe(
      FALLBACK
    )
  })

  it("falls back when message is not a string", () => {
    expect(messageFromErrorBody(JSON.stringify({ message: 42 }), FALLBACK)).toBe(
      FALLBACK
    )
    expect(
      messageFromErrorBody(JSON.stringify({ message: null }), FALLBACK)
    ).toBe(FALLBACK)
  })

  it("falls back when message is blank", () => {
    expect(messageFromErrorBody(JSON.stringify({ message: "   " }), FALLBACK)).toBe(
      FALLBACK
    )
  })

  it("handles a JSON body that is not an object", () => {
    expect(messageFromErrorBody('"just a string"', FALLBACK)).toBe(FALLBACK)
    expect(messageFromErrorBody("[1,2,3]", FALLBACK)).toBe(FALLBACK)
  })
})

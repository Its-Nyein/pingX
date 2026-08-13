import {
  isSearchable,
  likePattern,
  MIN_SEARCH_LENGTH,
  normaliseSearch,
} from "@/lib/search"
import { describe, expect, it } from "vitest"

describe("normaliseSearch", () => {
  it("trims surrounding whitespace", () => {
    expect(normaliseSearch("  PRO  ")).toBe("PRO")
  })
})

describe("isSearchable", () => {
  it("accepts a term at or over the minimum length", () => {
    expect(isSearchable("PRO")).toBe(true)
    expect(isSearchable("a".repeat(MIN_SEARCH_LENGTH))).toBe(true)
  })

  it("rejects terms that are too short to be useful", () => {
    expect(isSearchable("a")).toBe(false)
    expect(isSearchable("")).toBe(false)
    expect(isSearchable("   ")).toBe(false)
  })
})

describe("likePattern", () => {
  it("wraps the term for a substring match", () => {
    expect(likePattern("PRO")).toBe("%PRO%")
  })

  it("trims before wrapping", () => {
    expect(likePattern("  PRO  ")).toBe("%PRO%")
  })

  it("escapes LIKE wildcards so they match literally", () => {
    expect(likePattern("50%")).toBe("%50\\%%")
    expect(likePattern("a_b")).toBe("%a\\_b%")
    expect(likePattern("%")).toBe("%\\%%")
  })

  it("escapes the escape character itself", () => {
    expect(likePattern("a\\b")).toBe("%a\\\\b%")
  })

  it("leaves ordinary punctuation alone", () => {
    expect(likePattern("user@example.com")).toBe("%user@example.com%")
    expect(likePattern("/api/v1/events")).toBe("%/api/v1/events%")
  })
})

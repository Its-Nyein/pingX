import {
  DEFAULT_FONT,
  FONTS,
  isFontOption,
  readFont,
  writeFont,
} from "@/lib/font"
import { beforeEach, describe, expect, it, vi } from "vitest"

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
  vi.stubGlobal("document", { documentElement: { dataset: {} } })
  vi.stubGlobal("window", { dispatchEvent: vi.fn() })
})

describe("isFontOption", () => {
  it("accepts every offered font", () => {
    for (const font of FONTS) expect(isFontOption(font.value)).toBe(true)
  })

  it("rejects anything else", () => {
    expect(isFontOption("comic-sans")).toBe(false)
    expect(isFontOption("")).toBe(false)
    expect(isFontOption(null)).toBe(false)
  })
})

describe("readFont", () => {
  it("falls back to the default when nothing is set", () => {
    expect(readFont()).toBe(DEFAULT_FONT)
  })

  it("reads the applied font off the document", () => {
    document.documentElement.dataset.font = "manrope"
    expect(readFont()).toBe("manrope")
  })

  it("falls back when the attribute is not a known font", () => {
    document.documentElement.dataset.font = "papyrus"
    expect(readFont()).toBe(DEFAULT_FONT)
  })
})

describe("writeFont", () => {
  it("applies the font, persists it, and announces the change", () => {
    writeFont("manrope")

    expect(document.documentElement.dataset.font).toBe("manrope")
    expect(store.get("pingx-font")).toBe("manrope")
    expect(window.dispatchEvent).toHaveBeenCalled()
  })

  it("still applies the font when storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("denied")
      },
      removeItem: () => {},
    })

    expect(() => writeFont("system")).not.toThrow()
    expect(document.documentElement.dataset.font).toBe("system")
  })
})

export const FONTS = [
  { value: "inter", label: "Inter" },
  { value: "manrope", label: "Manrope" },
  { value: "system", label: "System" },
] as const

export type FontOption = (typeof FONTS)[number]["value"]

export const DEFAULT_FONT: FontOption = "inter"
export const FONT_STORAGE_KEY = "pingx-font"
export const FONT_CHANGE_EVENT = "pingx-font-change"

export const isFontOption = (value: unknown): value is FontOption =>
  FONTS.some((font) => font.value === value)

export const readFont = (): FontOption => {
  if (typeof document === "undefined") return DEFAULT_FONT

  const current = document.documentElement.dataset.font

  return isFontOption(current) ? current : DEFAULT_FONT
}

export const writeFont = (font: FontOption): void => {
  document.documentElement.dataset.font = font

  try {
    localStorage.setItem(FONT_STORAGE_KEY, font)
  } catch {
  }

  window.dispatchEvent(new Event(FONT_CHANGE_EVENT))
}

export const subscribeToFont = (onChange: () => void): (() => void) => {
  window.addEventListener(FONT_CHANGE_EVENT, onChange)
  window.addEventListener("storage", onChange)

  return () => {
    window.removeEventListener(FONT_CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

export const FONT_INIT_SCRIPT = `(function(){try{var f=localStorage.getItem("${FONT_STORAGE_KEY}");document.documentElement.dataset.font=(f==="inter"||f==="manrope"||f==="system")?f:"${DEFAULT_FONT}"}catch(e){document.documentElement.dataset.font="${DEFAULT_FONT}"}})()`

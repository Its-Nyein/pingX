"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_FONT,
  FONTS,
  readFont,
  subscribeToFont,
  writeFont,
  type FontOption,
} from "@/lib/font"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const

const Preview = ({ tone }: { tone: "light" | "dark" }) => (
  <div
    className={cn(
      "space-y-2 rounded-md p-2",
      tone === "light" ? "bg-[#ecedef]" : "bg-neutral-900"
    )}
  >
    <div
      className={cn(
        "space-y-2 rounded-md p-2 shadow-sm",
        tone === "light" ? "bg-white" : "bg-neutral-800"
      )}
    >
      <div
        className={cn(
          "h-2 w-20 rounded-lg",
          tone === "light" ? "bg-[#ecedef]" : "bg-neutral-400"
        )}
      />
      <div
        className={cn(
          "h-2 w-32 rounded-lg",
          tone === "light" ? "bg-[#ecedef]" : "bg-neutral-400"
        )}
      />
    </div>

    <div
      className={cn(
        "flex items-center gap-2 rounded-md p-2 shadow-sm",
        tone === "light" ? "bg-white" : "bg-neutral-800"
      )}
    >
      <div
        className={cn(
          "size-4 rounded-full",
          tone === "light" ? "bg-[#ecedef]" : "bg-neutral-400"
        )}
      />
      <div
        className={cn(
          "h-2 w-full rounded-lg",
          tone === "light" ? "bg-[#ecedef]" : "bg-neutral-400"
        )}
      />
    </div>
  </div>
)

export const AppearanceForm = () => {
  const { theme, setTheme } = useTheme()

  const font = useSyncExternalStore(
    subscribeToFont,
    readFont,
    () => DEFAULT_FONT
  )

  return (
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">Theme</legend>
        <p className="text-sm text-muted-foreground">
          Applies immediately and is remembered on this device.
        </p>

        <div className="grid max-w-md grid-cols-2 gap-4 pt-2">
          {THEMES.map((option) => {
            const isActive = theme === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={isActive}
                className={cn(
                  "rounded-md border-2 p-1 text-left transition-colors",
                  isActive
                    ? "border-primary"
                    : "border-border hover:border-foreground/30"
                )}
              >
                <Preview tone={option.value} />

                <span className="flex items-center gap-1.5 p-2 text-sm font-normal text-foreground">
                  {option.label}
                  {isActive ? (
                    <Check className="size-3.5 text-primary" />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">Font</legend>
        <p className="text-sm text-muted-foreground">
          Used across the app. System uses whatever your device provides, which
          loads nothing.
        </p>

        <div className="max-w-xs pt-2">
          <Select
            value={font}
            onValueChange={(value) => writeFont(value as FontOption)}
          >
            <SelectTrigger className="cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </fieldset>
    </div>
  )
}

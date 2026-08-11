import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export const PageBody = ({
  children,
  narrow = false,
  className,
}: {
  children: ReactNode
  narrow?: boolean
  className?: string
}) => (
  <div
    className={cn(
      "w-full px-6 py-6",
      narrow ? "max-w-3xl" : "max-w-6xl",
      className
    )}
  >
    {children}
  </div>
)

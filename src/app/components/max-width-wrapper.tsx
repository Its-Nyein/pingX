import { ReactNode } from "react"
import { cn } from "../lib/utils"

interface MaxWidthWrapperProps {
    className?: string,
    children: ReactNode
}

export const MaxWidthWrapper = ({children, className}: MaxWidthWrapperProps) => {
  return (
    <div className={cn("h-full mx-auto w-full max-w-screen-xl px-2.5 sm:px-20", className)}>{children}</div>
  )
}
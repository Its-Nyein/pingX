import { cn } from "@/lib/utils"
import { HTMLAttributes, ReactNode } from "react"

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
    children?: ReactNode
}

const Heading = ({children, className, ...props}: HeadingProps) => {
  return (
    <h1 className={cn(
        "text-2xl sm:text-4xl font-heading text-zinc-800 text-pretty font-semibold tracking-tighter", 
        className
        )}
        {...props}
        >
        {children}
    </h1>
  )
}

export default Heading
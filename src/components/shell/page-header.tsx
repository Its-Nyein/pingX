import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export const PageHeader = ({
  title,
  description,
  children,
  className,
}: PageHeaderProps) => {
  return (
    <div className={className}>

      <div className={cn("w-full max-w-6xl px-6 pt-5 pb-4")}>

        <h1 className="sr-only">{title}</h1>

        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}

        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </div>
  )
}

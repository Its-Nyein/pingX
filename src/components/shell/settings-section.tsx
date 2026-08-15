import { Separator } from "@/components/ui/separator"
import type { ReactNode } from "react"

export const SettingsSection = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) => (
  <section>
    <h2 className="text-lg font-medium tracking-tight text-foreground">
      {title}
    </h2>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>

    <Separator className="my-4" />

    <div className="max-w-xl">{children}</div>
  </section>
)

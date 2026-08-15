"use client"

import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { MessageSquare, Palette, UserCog, Wrench } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const ITEMS: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "Profile", href: "/dashboard/settings", icon: UserCog },
  { title: "Account", href: "/dashboard/settings/account", icon: Wrench },
  { title: "Discord", href: "/dashboard/settings/discord", icon: MessageSquare },
  { title: "Appearance", href: "/dashboard/settings/appearance", icon: Palette },
]

export const SettingsNav = () => {
  const pathname = usePathname()
  const router = useRouter()

  const current = ITEMS.find((item) => item.href === pathname) ?? ITEMS[0]
  const CurrentIcon = current.icon

  return (
    <>
      <div className="lg:hidden">
        <Select value={current.href} onValueChange={(value) => router.push(value)}>
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue>
              <span className="flex items-center gap-2">
                <CurrentIcon className="size-4" />
                {current.title}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ITEMS.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <span className="flex items-center gap-2">
                  <item.icon className="size-4" />
                  {item.title}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <nav className="hidden flex-col gap-1 lg:flex">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "justify-start gap-2",
                isActive
                  ? "bg-recessed font-medium text-foreground hover:bg-recessed"
                  : "text-foreground/80 hover:bg-recessed/70"
              )}
            >
              <item.icon className="size-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

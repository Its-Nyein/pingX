"use client"

import { cn } from "@/lib/utils"
import { SearchTrigger } from "@/components/shell/command-search"
import { BellRing, BookOpen, Gem, Hash, Home, Key, LifeBuoy, LucideIcon, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarItem {
  href: string
  icon: LucideIcon
  text: string
}

interface SidebarSection {
  category?: string
  items: SidebarItem[]
}

export const SIDEBAR_ITEMS: SidebarSection[] = [
  {
    items: [{ href: "/dashboard", icon: Home, text: "Overview" }],
  },
  {
    category: "Manage",
    items: [
      { href: "/dashboard/upgrade", icon: Gem, text: "Billing" },
      { href: "/dashboard/api-key", icon: Key, text: "Tokens" },
      { href: "/dashboard/alerts", icon: BellRing, text: "Alerts" },
      { href: "/dashboard/channels", icon: Hash, text: "Channels" },
      { href: "/dashboard/account-settings", icon: Settings, text: "Settings" },
    ],
  },
  {
    category: "Help",
    items: [
      { href: "/dashboard/docs", icon: BookOpen, text: "Documentation" },
      { href: "/dashboard/support", icon: LifeBuoy, text: "Support" },
    ],
  },
]

export const ProductSidebar = ({
  userLabel,
  onNavigate,
  onOpenSearch,
}: {
  userLabel?: string
  onNavigate?: () => void
  onOpenSearch?: () => void
}) => {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 py-3">
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cloudflare-orange text-xs font-bold text-white"
        >
          P
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {userLabel ?? "pingX"}
        </span>
      </div>

      {onOpenSearch ? (
        <div className="px-3 pb-3">
          <SearchTrigger onClick={onOpenSearch} />
        </div>
      ) : null}

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {SIDEBAR_ITEMS.map(({ category, items }, sectionIndex) => (
          <div key={category ?? `section-${sectionIndex}`} className="mb-4">
            {category ? (
              <p className="px-2 pb-1 text-sm text-muted-foreground">
                {category}
              </p>
            ) : null}

            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`)

                return (
                  <li key={`${item.href}-${item.text}`}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-2 text-base transition-colors",
                        isActive
                          ? "bg-recessed font-medium text-foreground"
                          : "text-foreground/80 hover:bg-recessed/70 hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{item.text}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}

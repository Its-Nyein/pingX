"use client"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"
import { Gem, Home, Key, Search, Settings, Tag } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

const NAV_ITEMS = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Billing", url: "/dashboard/upgrade", icon: Gem },
  { title: "Tokens", url: "/dashboard/api-key", icon: Key },
  { title: "Settings", url: "/dashboard/account-settings", icon: Settings },
]

export const CommandSearch = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  const { data: categories } = useQuery({
    queryKey: ["user-event-categories"],
    queryFn: async () => {
      const res = await client.category.getEventCategories.$get()
      const { categories } = await res.json()
      return categories
    },
    enabled: open,
  })

  const close = () => onOpenChange(false)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search">
      <CommandInput placeholder="Search pages and categories..." />

      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Go to">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.url} asChild value={item.title}>
              <Link href={item.url} onClick={close}>
                <item.icon className="text-muted-foreground" />
                {item.title}
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>

        {categories?.length ? (
          <CommandGroup heading="Categories">
            {categories.map((category) => (
              <CommandItem
                key={category.id}
                asChild

                value={`category ${category.name}`}
              >
                <Link
                  href={`/dashboard/category/${category.name}`}
                  onClick={close}
                >
                  <Tag className="text-muted-foreground" />
                  {category.name}
                </Link>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}

export const SearchTrigger = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-card px-2.5 text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
  >
    <Search className="size-4 shrink-0" />
    <span className="flex-1 truncate text-left text-sm">Quick search...</span>
    <kbd className="pointer-events-none rounded border border-border px-1 text-[11px] font-medium">
      ⌘K
    </kbd>
  </button>
)

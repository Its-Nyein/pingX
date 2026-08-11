"use client"

import { CommandSearch } from "@/components/shell/command-search"
import { GlobalHeader } from "@/components/shell/global-header"
import { ProductSidebar } from "@/components/shell/product-sidebar"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { X } from "lucide-react"
import { PropsWithChildren, useState } from "react"

export const DashboardShell = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { data: session } = authClient.useSession()
  const userLabel = session?.user.email

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block lg:w-72">
        <ProductSidebar
          userLabel={userLabel}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <GlobalHeader onOpenSidebar={() => setIsDrawerOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <Modal
        className="p-0"
        showModal={isDrawerOpen}
        setShowModal={setIsDrawerOpen}
      >
        <div className="flex items-center justify-end px-3 pt-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close navigation"
            onClick={() => setIsDrawerOpen(false)}
          >
            <X />
          </Button>
        </div>

        <ProductSidebar
          userLabel={userLabel}
          onNavigate={() => setIsDrawerOpen(false)}
          onOpenSearch={() => {
            setIsDrawerOpen(false)
            setIsSearchOpen(true)
          }}
        />
      </Modal>

      <CommandSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  )
}

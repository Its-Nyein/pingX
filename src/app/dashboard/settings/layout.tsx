import { PageBody } from "@/components/shell/page-body"
import { PageHeader } from "@/components/shell/page-header"
import { SettingsNav } from "@/components/shell/settings-nav"
import type { PropsWithChildren } from "react"

const Layout = ({ children }: PropsWithChildren) => (
  <>
    <PageHeader
      title="Settings"
      description="Your profile, your account, and where pingX delivers."
    />

    <PageBody>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="shrink-0 lg:w-48">
          <SettingsNav />
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </PageBody>
  </>
)

export default Layout

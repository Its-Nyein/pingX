import { DashboardShell } from "@/components/shell/dashboard-shell"
import { PropsWithChildren } from "react"

const Layout = ({ children }: PropsWithChildren) => {
  return <DashboardShell>{children}</DashboardShell>
}

export default Layout

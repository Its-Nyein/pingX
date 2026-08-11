import { ReactNode } from "react"

/**
 * Sign-in and sign-up render their own full-screen split layout, so this group
 * deliberately does not wrap them in the marketing Navbar.
 */
const Layout = ({ children }: { children: ReactNode }) => {
  return <>{children}</>
}

export default Layout

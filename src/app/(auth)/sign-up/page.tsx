import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"

const Page = async () => {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) redirect("/dashboard")

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start turning events into notifications"
    >
      <Suspense fallback={<div className="h-96" />}>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  )
}

export default Page

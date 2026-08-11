import { AuthShell } from "@/components/auth/auth-shell"
import { SignInForm } from "@/components/auth/sign-in-form"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"

const Page = async () => {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) redirect("/dashboard")

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      {/* SignInForm reads searchParams, so it needs a Suspense boundary. */}
      <Suspense fallback={<div className="h-96" />}>
        <SignInForm />
      </Suspense>
    </AuthShell>
  )
}

export default Page

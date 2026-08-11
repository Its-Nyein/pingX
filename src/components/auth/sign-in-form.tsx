"use client"

import { SocialButtons } from "@/components/auth/social-buttons"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { signInSchema, type SignInSchema } from "@/lib/validators/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

export const SignInForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // `intent=upgrade` comes from the pricing page for signed-out visitors, and
  // is forwarded so the dashboard opens Stripe checkout right after sign-in.
  const intent = searchParams.get("intent")
  const callbackUrl =
    searchParams.get("callbackUrl") ??
    (intent ? `/dashboard?intent=${intent}` : "/dashboard")

  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: SignInSchema) => {
    setIsLoading(true)

    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    })

    if (error) {
      // Deliberately generic: distinguishing "no such user" from "wrong
      // password" tells an attacker which emails are registered.
      toast.error(error.message ?? "Invalid email or password.")
      setIsLoading(false)
      return
    }

    toast.success("Signed in.")
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <SocialButtons callbackURL={callbackUrl} disabled={isLoading} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="h-12"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="h-12 pr-12"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-900"
                      tabIndex={-1}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="h-12 w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-brand-700 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}

import { z } from "zod"

/**
 * Password policy, kept in one place so sign-up and sign-in agree.
 * Mirrors the rules used in the shadcn-admin reference project.
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    PASSWORD_REGEX,
    "Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)"
  )

export const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  // Sign-in only checks that something was typed. Applying the full policy here
  // would leak the policy to anyone probing the form, and would lock out users
  // whose password predates a policy change.
  password: z.string().min(1, "Password is required"),
})

export const signUpSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(80, "Name is too long"),
    email: z.email("Enter a valid email address"),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignInSchema = z.infer<typeof signInSchema>
export type SignUpSchema = z.infer<typeof signUpSchema>

import { db } from "@/db"
import * as schema from "@/db/schema"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },

  user: {
    additionalFields: {
      plan: {
        type: ["FREE", "PRO"],
        required: true,
        defaultValue: "FREE",
        input: false,
      },
      apiKey: {
        type: "string",
        required: false,
        input: false,
      },
      discordId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
export type SessionUser = typeof auth.$Infer.Session.user

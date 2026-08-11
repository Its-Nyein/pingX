import { db } from "@/db"
import * as schema from "@/db/schema"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"

/**
 * Better Auth server instance. Imported by the route handler, the proxy, and
 * every server-side session read.
 *
 * BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment; they
 * are intentionally not passed here so the same code works across environments.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    // Better Auth addresses models by name ("user", "session", ...). Our schema
    // exports are plural to avoid shadowing local `user`/`session` variables at
    // call sites, so the mapping is spelled out rather than inferred.
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
      // These mirror the pingX columns on the `user` table. Better Auth
      // validates writes against this list, so a column without an entry here
      // is invisible to the auth layer - keep the two in sync.
      //
      // All are `input: false`: they are server-owned, and a client must not be
      // able to set its own plan or quota during signup.
      // required: true matches the NOT NULL columns and keeps these
      // non-nullable in the inferred session type. Safe with input: false
      // because defaultValue supplies them server-side on create.
      quotoaLimit: {
        type: "number",
        required: true,
        defaultValue: 100,
        input: false,
      },
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

  // Must be last: lets auth calls inside server actions set cookies.
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
export type SessionUser = typeof auth.$Infer.Session.user

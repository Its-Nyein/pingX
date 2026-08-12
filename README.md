# pingX

[![CI](https://github.com/itsnyein/pingX/actions/workflows/ci.yml/badge.svg)](https://github.com/itsnyein/pingX/actions/workflows/ci.yml)

Next.js 16 App Router SaaS that turns API calls into Discord notifications.
Better Auth for auth, Hono for the API layer, Drizzle ORM on Neon Postgres,
Stripe for billing.

## Getting started

```bash
npm install
cp .env.example .env
# fill in .env, then create the schema:
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`STRIPE_SECRET_KEY` must be set for `npm run build` as well as for `npm run dev`
— the Stripe client is constructed at module scope and throws on an empty key.

## Auth

Better Auth, with email/password plus Google and GitHub OAuth.

```
src/lib/auth.ts          server instance and config
src/lib/auth-client.ts   browser client (authClient.useSession, signIn, signOut)
src/lib/session.ts       server helpers: getSession, getCurrentUser, requireUser
src/app/api/auth/[...all]/route.ts   mounts the Better Auth handler
src/proxy.ts             cheap cookie gate on /dashboard
src/components/auth/     sign-in and sign-up UI
```

Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`. OAuth sign-in fails at runtime
until the Google and GitHub client IDs and secrets are set; register the
callback URL `<BETTER_AUTH_URL>/api/auth/callback/<provider>` with each.

### One user table

pingX's application columns (`quotoaLimit`, `plan`, `apiKey`, `discordId`) live
on Better Auth's `user` table rather than in a separate table. That means a
session read already carries them and no join or second query is needed:

```ts
const user = await requireUser()
user.plan     // "FREE" | "PRO"
user.apiKey
```

**These columns are declared in two places** — as Drizzle columns in
`src/db/schema/users.ts`, and as `user.additionalFields` in `src/lib/auth.ts`.
Adding one without the other means the column exists but the auth layer cannot
read or write it. They are marked `input: false`, so a client cannot set its own
plan or quota at signup.

Route protection is layered: `src/proxy.ts` only checks that a session cookie is
present, which is cheap enough to run on every navigation, and each page does
the authoritative `getSession` check before rendering. Do not treat the proxy as
the security boundary.

## Database

The database is Neon Postgres, accessed through Drizzle ORM using the
`neon-http` driver. That driver is stateless and does not support interactive
transactions, which suits this codebase — it issues none. If a transaction is
ever needed, switch `src/db/index.ts` to `drizzle-orm/neon-serverless`.

```
src/db/index.ts        client, plus a re-export of the schema
src/db/schema/         one file per table, plus enums and relations
drizzle.config.ts      drizzle-kit config
drizzle/migrations/    generated migrations
drizzle/manual/        migrations that are applied by hand, never by drizzle-kit
```

Import both the client and the tables from `@/db`:

```ts
import { db, users } from "@/db"
import { eq } from "drizzle-orm"

const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run db:generate` | Diff the schema and write a migration to `drizzle/migrations` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:push` | Push the schema straight to the database, skipping migration files |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run typecheck` | `tsc --noEmit` |

Review generated SQL before applying it to a database that holds real data.
`db:push` is for scratch databases; it does not ask before dropping things.

### Schema conventions

Better Auth's tables (`user`, `session`, `account`, `verification`) are
lowercase singular, because the adapter addresses them by model name. The
application tables (`EventCategory`, `Event`, `Quota`) keep their original
mixed-case names. Column names are always spelled out explicitly rather than
relying on implicit mapping, so renaming a TypeScript key cannot silently
rename a column.

Worth knowing:

- `quotoaLimit` is misspelled. That is the real column name; renaming it is a
  separate change.
- `updatedAt` columns have no database default — they use `$defaultFn` +
  `$onUpdate` and are managed in the application.
- `Quota.userId` is unique: one quota row per user, incremented across months.
  `year`/`month` record when it was last reset, they are not part of the key.
- Every foreign key to `user` cascades on delete.

See `drizzle/README.md` for details.

## Testing

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # v8 coverage
```

Vitest, configured in `vitest.config.mts` with the same `@/` alias as
`tsconfig.json`. Tests live in `tests/unit/` and are pure — no database, no
network — so they run in CI without secrets.

CI (`.github/workflows/ci.yml`) runs typecheck → lint → test → build on Node 20
and 22 for every pull request and every push to `main`.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Drizzle ORM documentation](https://orm.drizzle.team)

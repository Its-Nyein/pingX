# pingX

Next.js 16 App Router SaaS that turns API calls into Discord notifications.
Clerk for auth, Hono for the API layer, Drizzle ORM on Neon Postgres, Stripe for
billing.

## Getting started

```bash
npm install
cp .env.example .env
# fill in .env, then:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`STRIPE_SECRET_KEY` must be set for `npm run build` as well as for `npm run dev`
— the Stripe client is constructed at module scope and throws on an empty key.

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

The tables were originally created by Prisma, so every identifier in the
database is quoted and mixed-case (`"User"`, `"eventCategoryId"`,
`"User_email_key"`). The schema files therefore name every table, column, index,
unique constraint and foreign key explicitly rather than relying on Drizzle's
implicit mapping. Keep it that way — an implicit name that happens to match
today will silently drift the moment a TypeScript key is renamed.

Two consequences worth knowing:

- `quotoaLimit` on `"User"` is misspelled in the database. The typo is the real
  column name and is reproduced deliberately.
- `updatedAt` columns have no database default. Prisma managed them in the
  application, so they use `$defaultFn` + `$onUpdate` to match.

`drizzle/migrations/0000_baseline_existing_schema.sql` is a **baseline**
describing objects that already exist. Do not apply it to the live database.
See `drizzle/README.md`.

### Outstanding migration

`drizzle/manual/0001_add_quota_userid_unique.sql` has **not** been applied. Until
it is, the quota upsert in `src/app/api/v1/events/route.ts` will fail with
Postgres error 42P10. Read the file before running it — it has a pre-check that
must return zero rows.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Drizzle ORM documentation](https://orm.drizzle.team)

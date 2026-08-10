# Drizzle migrations

## `migrations/0000_baseline_existing_schema.sql` — DO NOT APPLY

This is a **baseline**, not a change. The Neon database already contains every
object in it, created by the original Prisma migrations. It exists so
`drizzle-kit generate` has a snapshot to diff future changes against.

Running `drizzle-kit migrate` on a fresh checkout would try to execute it and
fail with "relation already exists". Mark it as applied instead, once, by
inserting its hash into Drizzle's bookkeeping table:

```sql
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
```

Then insert the `hash` and `when` values from
`migrations/meta/_journal.json` for tag `0000_baseline_existing_schema`.

Only a database built from scratch (a new preview branch, a local Postgres)
should actually execute `0000`.

## Parity with the pre-existing database

`0000` was hand-verified statement-by-statement against
`prisma/migrations/20250209165354_init` and `20250314102710_`. Tables, columns,
types, nullability, defaults, enum members and order, index names, unique
constraint names, foreign key names, and referential actions all match.

Two cosmetic differences that require **no** DDL:

1. Drizzle emits `DEFAULT now()` where Prisma emitted `DEFAULT CURRENT_TIMESTAMP`.
   These are the same function in Postgres — `CURRENT_TIMESTAMP` is the SQL
   standard spelling of `now()` — and are stored identically in the catalog.
2. The three unique columns on `"User"` are emitted as table `UNIQUE`
   constraints, where Prisma created bare `CREATE UNIQUE INDEX` statements. A
   Postgres unique constraint is implemented as a unique index of the same name,
   so the enforced behaviour and the index name are identical; only the
   `pg_constraint` catalog entry differs.

## `manual/0001_add_quota_userid_unique.sql` — NOT APPLIED

A genuine schema drift fix, kept out of `migrations/` so it is never picked up
by `drizzle-kit migrate`. Read the file — it has a pre-check that must return
zero rows first. See the note in `src/db/schema/quotas.ts`.

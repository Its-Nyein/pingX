# Drizzle migrations

`migrations/0000_init.sql` creates the whole schema from nothing - seven tables
and two enums. Unlike the previous baseline, it **is** meant to be applied:

```bash
npm run db:migrate
```

## What's in it

Four tables are owned by Better Auth (`user`, `session`, `account`,
`verification`) and four by the application (`EventCategory`, `Event`, `Quota`
- `user` is shared).

There is one user table, not two. Better Auth's core columns and pingX's
application columns (`plan`, `apiKey`, `discordId`) live side by side on
`user`. The application columns are declared twice: once as Drizzle
columns in `src/db/schema/users.ts`, and once as `user.additionalFields` in
`src/lib/auth.ts`. **Both must be updated together** - Better Auth validates
writes against its own list, so a column that exists only in the Drizzle schema
is invisible to the auth layer.

## Naming

Better Auth's tables are lowercase singular because that is what the adapter
expects for its model names. The application tables keep the mixed-case names
they have always had. The inconsistency is cosmetic; normalising it would be a
rename migration and is not worth doing for its own sake.

## Notes

- `Quota.userId` is unique, so a user has one quota row. The earlier Prisma
  schema declared this constraint but never migrated it, which is why the quota
  upsert could not work against the old database. It is created properly here.
- Every foreign key to `user` cascades on delete, so removing a user removes
  their sessions, accounts, categories, events and quota.

## Scripts

`db:push` reconciles the database against the schema without migration files.
It is for scratch databases only - it will offer to drop anything it does not
recognise, and it does not ask twice.

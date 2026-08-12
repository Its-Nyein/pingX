# Rollback notes

Drizzle does not generate down-migrations. Anything destructive gets its
reversal written here before the forward migration is applied.

---

## 0001_add_quota_warned80

**Forward** — `ALTER TABLE "Quota" ADD COLUMN "warned80" boolean DEFAULT false NOT NULL;`

Purely additive. Safe to apply while the current code is running: it has a
default, so existing rows are backfilled to `false` and code that doesn't know
about the column is unaffected.

**Rollback**

```sql
ALTER TABLE "Quota" DROP COLUMN "warned80";
```

Loses only which users have already been warned this month. The effect is at
most one duplicate warning per user per month.

---

## 0002_drop_dead_columns

**Forward**

```sql
ALTER TABLE "Event" DROP COLUMN "formattedMessage";
ALTER TABLE "user"  DROP COLUMN "quotoaLimit";
```

**Destructive. Apply only after the code that stopped writing these columns is
deployed** — i.e. after this PR is live. Applied earlier, event ingestion breaks
immediately: `formattedMessage` is `NOT NULL` with no default, so every insert
from the old code fails.

Both columns were verified dead before removal:

- `quotoaLimit` — never read anywhere. Plan limits come from `FREE_QUOTA` /
  `PRO_QUOTA` in `src/config.ts`. It was also declared as a Better Auth
  `additionalField`, removed in `src/lib/auth.ts` in the same change.
- `formattedMessage` — written on every insert, never read by any query, route
  or component.

**Rollback**

```sql
-- Restores the columns. Data in them is NOT recoverable.
ALTER TABLE "user"  ADD COLUMN "quotoaLimit" integer DEFAULT 100 NOT NULL;
ALTER TABLE "Event" ADD COLUMN "formattedMessage" text NOT NULL DEFAULT '';
```

`formattedMessage` originally had no default. It is added here with `DEFAULT ''`
because existing rows need a value; drop the default afterwards if you are
genuinely reverting the code as well:

```sql
ALTER TABLE "Event" ALTER COLUMN "formattedMessage" DROP DEFAULT;
```

The previous contents were `"<Title>\n\n<description>"` — the capitalised
category name, a blank line, then the embed description. Both parts are still
produced by `formatDiscordEmbed` in `src/lib/format-discord-embed.ts`, so the
column is reconstructible if it is ever needed.

### Suggested order

1. Merge and deploy this PR (code stops writing both columns).
2. Apply `0001` — safe at any time.
3. Verify ingestion and the dashboard are healthy.
4. Apply `0002`.

Steps 1–3 and step 4 can be separated by as long as you like; nothing depends on
the columns being gone.

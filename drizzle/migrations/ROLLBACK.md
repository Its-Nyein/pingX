# Rollback notes

Drizzle does not generate down-migrations. Anything destructive gets its
reversal written here before the forward migration is applied.

---

## 0001_add_quota_warned80

**Forward** - `ALTER TABLE "Quota" ADD COLUMN "warned80" boolean DEFAULT false NOT NULL;`

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
deployed** - i.e. after this PR is live. Applied earlier, event ingestion breaks
immediately: `formattedMessage` is `NOT NULL` with no default, so every insert
from the old code fails.

Both columns were verified dead before removal:

- `quotoaLimit` - never read anywhere. Plan limits come from `FREE_QUOTA` /
  `PRO_QUOTA` in `src/config.ts`. It was also declared as a Better Auth
  `additionalField`, removed in `src/lib/auth.ts` in the same change.
- `formattedMessage` - written on every insert, never read by any query, route
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

The previous contents were `"<Title>\n\n<description>"` - the capitalised
category name, a blank line, then the embed description. Both parts are still
produced by `formatDiscordEmbed` in `src/lib/format-discord-embed.ts`, so the
column is reconstructible if it is ever needed.

### Suggested order

1. Merge and deploy this PR (code stops writing both columns).
2. Apply `0001` - safe at any time.
3. Verify ingestion and the dashboard are healthy.
4. Apply `0002`.

Steps 1–3 and step 4 can be separated by as long as you like; nothing depends on
the columns being gone.

---

## 0003_add_event_indexes

**Forward**

```sql
CREATE INDEX "Event_eventCategoryId_createdAt_idx" ON "Event" USING btree ("eventCategoryId","createdAt" DESC NULLS LAST);
CREATE INDEX "Event_userId_idx" ON "Event" USING btree ("userId");
```

Purely additive. Every hot query filters `eventCategoryId` and orders by
`createdAt DESC`, and a Postgres foreign key does not create an index, so these
were sequential scans. Safe to apply while the current code is running - an
index changes plans, never results.

`CREATE INDEX` takes a write lock for the duration of the build. On the current
table (tens of rows) that is imperceptible. If `Event` ever grows large enough
for that to matter, rebuild with `CREATE INDEX CONCURRENTLY`, which cannot run
inside the migration runner's transaction and would need applying by hand.

**Rollback**

```sql
DROP INDEX "Event_eventCategoryId_createdAt_idx";
DROP INDEX "Event_userId_idx";
```

Loses nothing but the query plans.

---

## 0004_add_delivery_receipts

**Forward**

```sql
ALTER TABLE "Event" ADD COLUMN "deliveredAt" timestamp(3);
ALTER TABLE "Event" ADD COLUMN "lastError" text;
```

Purely additive and both nullable, so existing rows and the currently deployed
build are unaffected. `deliveryStatus` recorded that a delivery failed but never
why or when it succeeded, which left a `FAILED` event with nothing to act on.

**Rollback**

```sql
ALTER TABLE "Event" DROP COLUMN "deliveredAt";
ALTER TABLE "Event" DROP COLUMN "lastError";
```

Loses the diagnostics only. Delivery status itself is unaffected.

---

## 0005_cascade_event_category_delete

**Forward** - drops and recreates the `Event.eventCategoryId` foreign key with
`ON DELETE CASCADE` in place of `ON DELETE SET NULL`.

Deleting a category used to leave its events behind with a null category:
unreachable from every dashboard query, uncounted, and permanent. Observed
live, where deleting three demo categories stranded fifty events. Cascade makes
the delete mean what the confirm dialog says it means.

**Rollback**

```sql
ALTER TABLE "Event" DROP CONSTRAINT "Event_eventCategoryId_EventCategory_id_fk";
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventCategoryId_EventCategory_id_fk"
  FOREIGN KEY ("eventCategoryId") REFERENCES "EventCategory"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
```

Reverting restores the orphaning behaviour; it does not bring back events that
a cascade has already removed. There is no way to recover those, which is worth
weighing before applying this against data you care about.

---

## 0006_add_rate_limits

**Forward** - creates the `RateLimit` table: one row per API key holding the
current fixed window and its request count.

Purely additive, a new table nothing else references. Backed by Postgres rather
than Redis on purpose: the project has no Redis credentials, and a rate limiter
that silently does nothing is worse than none - the same trust problem as a
green badge over tests that never run.

**Rollback**

```sql
DROP TABLE "RateLimit";
```

Loses only the in-flight counters. The next request starts a fresh window.

---

## 0007_rate_limit_window_as_epoch

**Forward** - replaces `RateLimit.windowStart` with a `bigint` holding epoch
milliseconds. The column is dropped and re-added rather than cast: Postgres has
no implicit `timestamp` to `bigint` conversion, and the generated `SET DATA
TYPE` failed on that. The table is truncated first because it holds only
in-flight counters, so there is nothing to preserve.

`0006` stored the window as a timestamp, and the upsert compares the stored
window against the current one to decide between incrementing and resetting.
That comparison returned false for identical values: the driver's timestamp
serialization does not round-trip through the parameter binding, so every
second request reset its own counter and the limit never applied. An integer
epoch has no serialization ambiguity, which is the same reason `Quota` stores
year and month as integers.

**Rollback**

```sql
ALTER TABLE "RateLimit" DROP COLUMN "windowStart";
ALTER TABLE "RateLimit" ADD COLUMN "windowStart" timestamp(3) NOT NULL;
```

Reverting reintroduces the comparison bug. Counters are in-flight state only.

---

## 0008_add_webhook_events

**Forward** - creates `WebhookEvent`, one row per Stripe event id already
handled.

Purely additive. Stripe retries any non-2xx delivery, so the handler has always
been able to run twice; it was benign only because the single write it made was
idempotent. Refund and dispute handling changes that, so the id is claimed
before any work and released if the work throws.

**Rollback**

```sql
DROP TABLE "WebhookEvent";
```

Loses the record of which events were processed, so a Stripe retry after that
point would be handled again.

---

## 0009_add_event_data_search_index

**Forward**

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Event_data_trgm_idx" ON "Event" USING gin (("data"::text) gin_trgm_ops);
```

Purely additive. Search matches against the jsonb payload rendered as text, and
a trigram GIN index is what makes `ILIKE '%term%'` use an index rather than
scanning every row. drizzle-kit generates the index but not the extension that
provides `gin_trgm_ops`, so the `CREATE EXTENSION` line is added by hand - the
migration fails without it.

**Rollback**

```sql
DROP INDEX "Event_data_trgm_idx";
```

Leave the extension: dropping it would break any other index that comes to rely
on it, and it costs nothing idle. Search keeps working without the index, just
with a sequential scan.

---

## 0010_add_alert_rules

**Forward** - creates the `AlertMetric` enum, `AlertRule` and `AlertHistory`.

Purely additive: three new objects nothing else references. A rule scoped to one
category cascades with that category, and every rule cascades with its owner, so
deleting either leaves no orphans - the mistake `0005` existed to fix.

`lastTriggeredAt` lives on the rule rather than being derived from history,
because the cooldown check runs on the ingestion path and must not pay for an
aggregate over history on every event.

**Rollback**

```sql
DROP TABLE "AlertHistory";
DROP TABLE "AlertRule";
DROP TYPE "AlertMetric";
```

Loses configured rules and their trigger history. Events are untouched.

---

## 0011_add_channels

**Forward** - creates the `ChannelType` enum and `Channel`, and adds
`EventCategory.channelId`.

Purely additive. A category with a null `channelId` delivers to the owner's
Discord DM exactly as before, so nothing changes for anyone who does not create
a channel. Deleting a channel sets the column back to null rather than cascading,
because losing a delivery target should fall back to the DM, not delete the
category and its events.

**Rollback**

```sql
ALTER TABLE "EventCategory" DROP COLUMN "channelId";
DROP TABLE "Channel";
DROP TYPE "ChannelType";
```

Every category returns to DM delivery. Events are untouched.

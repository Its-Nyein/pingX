CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "Event_data_trgm_idx" ON "Event" USING gin (("data"::text) gin_trgm_ops);
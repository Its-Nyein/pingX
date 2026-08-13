TRUNCATE TABLE "RateLimit";--> statement-breakpoint
ALTER TABLE "RateLimit" DROP COLUMN "windowStart";--> statement-breakpoint
ALTER TABLE "RateLimit" ADD COLUMN "windowStart" bigint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "RateLimit" ALTER COLUMN "windowStart" DROP DEFAULT;

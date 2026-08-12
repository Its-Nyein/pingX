ALTER TABLE "Event" ADD COLUMN "deliveredAt" timestamp (3);--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "lastError" text;
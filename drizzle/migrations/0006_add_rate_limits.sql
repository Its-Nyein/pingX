CREATE TABLE "RateLimit" (
	"key" text PRIMARY KEY NOT NULL,
	"windowStart" timestamp (3) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);

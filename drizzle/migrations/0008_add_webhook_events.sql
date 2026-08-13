CREATE TABLE "WebhookEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processedAt" timestamp (3) DEFAULT now() NOT NULL
);

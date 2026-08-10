CREATE TYPE "public"."Plan" AS ENUM('FREE', 'PRO');--> statement-breakpoint
CREATE TYPE "public"."Status" AS ENUM('PENDING', 'DELIVERED', 'FAILED');--> statement-breakpoint
CREATE TABLE "EventCategory" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Event" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"data" jsonb NOT NULL,
	"formattedMessage" text NOT NULL,
	"deliveryStatus" "Status" DEFAULT 'PENDING' NOT NULL,
	"userId" text NOT NULL,
	"eventCategoryId" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"externalId" text,
	"quotoaLimit" integer NOT NULL,
	"plan" "Plan" DEFAULT 'FREE' NOT NULL,
	"email" text NOT NULL,
	"apiKey" text NOT NULL,
	"discordId" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	CONSTRAINT "User_externalId_key" UNIQUE("externalId"),
	CONSTRAINT "User_email_key" UNIQUE("email"),
	CONSTRAINT "User_apiKey_key" UNIQUE("apiKey")
);
--> statement-breakpoint
CREATE TABLE "Quota" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventCategoryId_fkey" FOREIGN KEY ("eventCategoryId") REFERENCES "public"."EventCategory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "EventCategory_name_userId_key" ON "EventCategory" USING btree ("name","userId");--> statement-breakpoint
CREATE INDEX "Event_createdAt_idx" ON "Event" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "User_email_apiKey_idx" ON "User" USING btree ("email","apiKey");
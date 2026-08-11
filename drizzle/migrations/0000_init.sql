CREATE TYPE "public"."Plan" AS ENUM('FREE', 'PRO');--> statement-breakpoint
CREATE TYPE "public"."Status" AS ENUM('PENDING', 'DELIVERED', 'FAILED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp (3),
	"refreshTokenExpiresAt" timestamp (3),
	"scope" text,
	"idToken" text,
	"password" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"quotoaLimit" integer DEFAULT 100 NOT NULL,
	"plan" "Plan" DEFAULT 'FREE' NOT NULL,
	"apiKey" text NOT NULL,
	"discordId" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_apiKey_unique" UNIQUE("apiKey")
);
--> statement-breakpoint
CREATE TABLE "Quota" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	CONSTRAINT "Quota_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventCategoryId_EventCategory_id_fk" FOREIGN KEY ("eventCategoryId") REFERENCES "public"."EventCategory"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "EventCategory_name_userId_key" ON "EventCategory" USING btree ("name","userId");--> statement-breakpoint
CREATE INDEX "Event_createdAt_idx" ON "Event" USING btree ("createdAt");
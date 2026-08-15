CREATE TYPE "public"."ChannelType" AS ENUM('DISCORD_WEBHOOK');--> statement-breakpoint
CREATE TABLE "Channel" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "ChannelType" NOT NULL,
	"name" text NOT NULL,
	"target" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "EventCategory" ADD COLUMN "channelId" text;--> statement-breakpoint
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Channel_userId_idx" ON "Channel" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_channelId_Channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."Channel"("id") ON DELETE set null ON UPDATE no action;
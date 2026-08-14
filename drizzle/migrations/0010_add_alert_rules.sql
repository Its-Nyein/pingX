CREATE TYPE "public"."AlertMetric" AS ENUM('FAILED_EVENTS', 'ALL_EVENTS');--> statement-breakpoint
CREATE TABLE "AlertHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"alertRuleId" text NOT NULL,
	"observed" integer NOT NULL,
	"triggeredAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AlertRule" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"eventCategoryId" text,
	"metric" "AlertMetric" NOT NULL,
	"threshold" integer NOT NULL,
	"windowMinutes" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"lastTriggeredAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AlertHistory" ADD CONSTRAINT "AlertHistory_alertRuleId_AlertRule_id_fk" FOREIGN KEY ("alertRuleId") REFERENCES "public"."AlertRule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_eventCategoryId_EventCategory_id_fk" FOREIGN KEY ("eventCategoryId") REFERENCES "public"."EventCategory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "AlertHistory_rule_triggeredAt_idx" ON "AlertHistory" USING btree ("alertRuleId","triggeredAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "AlertRule_userId_idx" ON "AlertRule" USING btree ("userId");
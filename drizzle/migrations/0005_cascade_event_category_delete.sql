ALTER TABLE "Event" DROP CONSTRAINT "Event_eventCategoryId_EventCategory_id_fk";
--> statement-breakpoint
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventCategoryId_EventCategory_id_fk" FOREIGN KEY ("eventCategoryId") REFERENCES "public"."EventCategory"("id") ON DELETE cascade ON UPDATE no action;
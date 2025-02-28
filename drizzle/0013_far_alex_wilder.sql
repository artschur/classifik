CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"companion_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"user_agent" text,
	"ip_hash" text
);
--> statement-breakpoint
ALTER TABLE "companions" ALTER COLUMN "instagram" SET DATA TYPE varchar(40);--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE no action ON UPDATE no action;
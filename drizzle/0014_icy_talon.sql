CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"companion_id" integer NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"storage_path" text NOT NULL,
	"public_url" text NOT NULL,
	"verified" boolean DEFAULT false,
	"verification_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ALTER COLUMN "companion_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_auth_idx" ON "documents" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "documents_companion_idx" ON "documents" USING btree ("companion_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "analytics_events_companion_idx" ON "analytics_events" USING btree ("companion_id");--> statement-breakpoint
CREATE INDEX "analytics_events_type_idx" ON "analytics_events" USING btree ("event_type");
ALTER TABLE "analytics_events" DROP CONSTRAINT "analytics_events_companion_id_companions_id_fk";
--> statement-breakpoint
ALTER TABLE "characteristics" DROP CONSTRAINT "characteristics_companion_id_companions_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_companion_id_companions_id_fk";
--> statement-breakpoint
ALTER TABLE "images" DROP CONSTRAINT "images_companion_id_companions_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_companion_id_companions_id_fk";
--> statement-breakpoint
ALTER TABLE "analytics_events" ALTER COLUMN "companion_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "companions" ALTER COLUMN "verified" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "is_verification_video" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characteristics" ADD CONSTRAINT "characteristics_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE cascade ON UPDATE no action;
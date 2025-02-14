DROP INDEX "images_owner_idx";--> statement-breakpoint
DROP INDEX "images_companion_idx";--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "companion_id" integer;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "images_ownimages_auth_idx" ON "images" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "images_companion_idx" ON "images" USING btree ("companion_id");
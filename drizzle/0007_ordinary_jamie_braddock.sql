CREATE TABLE "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text,
	"storage_path" text NOT NULL,
	"public_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "images_owner_idx" ON "images" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "images_companion_idx" ON "images" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "images_created_idx" ON "images" USING btree ("created_at");
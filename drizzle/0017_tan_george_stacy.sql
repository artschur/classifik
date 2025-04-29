CREATE TABLE "audio_recordings" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text,
	"companion_id" integer NOT NULL,
	"storage_path" text NOT NULL,
	"public_url" text NOT NULL,
	"duration_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audio_owner_idx" ON "audio_recordings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "audio_companion_idx" ON "audio_recordings" USING btree ("companion_id");--> statement-breakpoint
CREATE INDEX "audio_created_idx" ON "audio_recordings" USING btree ("created_at");
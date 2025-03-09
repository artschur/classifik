ALTER TABLE "audio_recordings" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audio_recordings" DROP COLUMN "duration_seconds";
ALTER TABLE "images" ALTER COLUMN "companion_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "likes" integer DEFAULT 0;
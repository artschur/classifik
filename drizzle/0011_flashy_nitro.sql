ALTER TABLE "reviews" ADD COLUMN "user_image_url" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "liked_by" text[] DEFAULT ARRAY[]::TEXT[];--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "likes";
ALTER TABLE "locations" RENAME TO "cities";--> statement-breakpoint
ALTER TABLE "companions" DROP CONSTRAINT "companions_location_id_locations_id_fk";
--> statement-breakpoint
ALTER TABLE "neighborhoods" DROP CONSTRAINT "neighborhoods_city_id_locations_id_fk";
--> statement-breakpoint
ALTER TABLE "companions" ALTER COLUMN "languages" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "companions" ALTER COLUMN "languages" SET DEFAULT ARRAY[]::TEXT[];--> statement-breakpoint
ALTER TABLE "companions" ALTER COLUMN "languages" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "auth_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "phone" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "short_description" varchar(60) NOT NULL;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "availability" jsonb;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "reviews_summary" jsonb;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "last_seen" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "rating" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "companions" ADD CONSTRAINT "companions_location_id_cities_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
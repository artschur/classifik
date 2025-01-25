CREATE TABLE "neighborhoods" (
	"id" serial PRIMARY KEY NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"city_id" integer NOT NULL,
	"slug" varchar(100) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "locations" DROP CONSTRAINT "locations_companion_id_companions_id_fk";
--> statement-breakpoint
DROP INDEX "locations_slug_idx";--> statement-breakpoint
DROP INDEX "locations_city_state_idx";--> statement-breakpoint
DROP INDEX "locations_companion_idx";--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "location_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "neighborhood_id" integer;--> statement-breakpoint
ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_city_id_locations_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "neighborhoods_slug_idx" ON "neighborhoods" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "neighborhoods_city_idx" ON "neighborhoods" USING btree ("city_id");--> statement-breakpoint
ALTER TABLE "companions" ADD CONSTRAINT "companions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companions" ADD CONSTRAINT "companions_neighborhood_id_neighborhoods_id_fk" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."neighborhoods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "compations_city_idx" ON "companions" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "cities_slug_idx" ON "locations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cities_city_state_idx" ON "locations" USING btree ("state","city");--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "companion_id";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "neighborhood";
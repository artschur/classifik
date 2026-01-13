CREATE TABLE "blocked_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"companion_id" integer NOT NULL,
	"blocked_user_id" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_payment_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"max_allowed_date" timestamp NOT NULL,
	"clerk_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"plan_type" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"clerk_id" text NOT NULL,
	"price_id" text,
	"product_id" text,
	"plan_type" varchar(50),
	"status" varchar(50) NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "companions" ALTER COLUMN "instagram" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "companion_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "has_active_ad" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "ad_expiration_date" timestamp;--> statement-breakpoint
ALTER TABLE "companions" ADD COLUMN "plan_type" varchar(50) DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_stripe_customer_id_companions_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."companions"("stripe_customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_stripe_customer_id_companions_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."companions"("stripe_customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocked_users_companion_idx" ON "blocked_users" USING btree ("companion_id");--> statement-breakpoint
CREATE INDEX "blocked_users_user_idx" ON "blocked_users" USING btree ("blocked_user_id");--> statement-breakpoint
CREATE INDEX "blocked_users_unique_idx" ON "blocked_users" USING btree ("companion_id","blocked_user_id");--> statement-breakpoint
CREATE INDEX "payments_stripe_idx" ON "payments" USING btree ("stripe_payment_id");--> statement-breakpoint
CREATE INDEX "payments_clerk_idx" ON "payments" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "subscriptions_subscription_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_clerk_idx" ON "subscriptions" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "companions_stripe_idx" ON "companions" USING btree ("stripe_customer_id");--> statement-breakpoint
ALTER TABLE "companions" ADD CONSTRAINT "companions_stripe_customer_id_unique" UNIQUE("stripe_customer_id");
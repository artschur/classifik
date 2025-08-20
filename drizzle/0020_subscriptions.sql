CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" serial PRIMARY KEY NOT NULL,
  "stripe_subscription_id" text NOT NULL UNIQUE,
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
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "subscriptions_subscription_idx" ON "subscriptions" ("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "subscriptions_clerk_idx" ON "subscriptions" ("clerk_id");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" ("status");





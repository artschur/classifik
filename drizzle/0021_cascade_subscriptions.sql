-- Drop existing foreign key constraints
ALTER TABLE "subscriptions"
DROP CONSTRAINT IF EXISTS "subscriptions_stripe_customer_id_companions_stripe_customer_id_fk";

ALTER TABLE "payments"
DROP CONSTRAINT IF EXISTS "payments_stripe_customer_id_companions_stripe_customer_id_fk";

-- Add foreign key constraints with CASCADE
ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_stripe_customer_id_companions_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "companions" ("stripe_customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments"
ADD CONSTRAINT "payments_stripe_customer_id_companions_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "companions" ("stripe_customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "blocked_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"companion_id" integer NOT NULL,
	"blocked_user_id" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "blocked_users_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "companions"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "blocked_users_companion_idx" ON "blocked_users" ("companion_id");
CREATE INDEX IF NOT EXISTS "blocked_users_user_idx" ON "blocked_users" ("blocked_user_id");
CREATE INDEX IF NOT EXISTS "blocked_users_unique_idx" ON "blocked_users" ("companion_id", "blocked_user_id"); 
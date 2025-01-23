ALTER TABLE "caracteristicas" RENAME TO "characteristics";--> statement-breakpoint
ALTER TABLE "acompanhantes" RENAME TO "companions";--> statement-breakpoint
ALTER TABLE "localizacao" RENAME TO "locations";--> statement-breakpoint
ALTER TABLE "companions" RENAME COLUMN "nome" TO "name";--> statement-breakpoint
ALTER TABLE "companions" RENAME COLUMN "descricao" TO "description";--> statement-breakpoint
ALTER TABLE "companions" RENAME COLUMN "preco" TO "price";--> statement-breakpoint
ALTER TABLE "companions" RENAME COLUMN "idade" TO "age";--> statement-breakpoint
ALTER TABLE "companions" RENAME COLUMN "genero" TO "gender";--> statement-breakpoint
ALTER TABLE "companions" RENAME COLUMN "identidade_genero" TO "gender_identity";--> statement-breakpoint
ALTER TABLE "companions" RENAME COLUMN "idiomas" TO "languages";--> statement-breakpoint
ALTER TABLE "companions" RENAME COLUMN "verificada" TO "verified";--> statement-breakpoint
ALTER TABLE "characteristics" RENAME COLUMN "pessoa_id" TO "companion_id";--> statement-breakpoint
ALTER TABLE "characteristics" RENAME COLUMN "peso" TO "weight";--> statement-breakpoint
ALTER TABLE "characteristics" RENAME COLUMN "altura" TO "height";--> statement-breakpoint
ALTER TABLE "characteristics" RENAME COLUMN "etnia" TO "ethnicity";--> statement-breakpoint
ALTER TABLE "characteristics" RENAME COLUMN "cor_olhos" TO "eye_color";--> statement-breakpoint
ALTER TABLE "characteristics" RENAME COLUMN "cor_cabelo" TO "hair_color";--> statement-breakpoint
ALTER TABLE "characteristics" RENAME COLUMN "tamanho_cabelo" TO "hair_length";--> statement-breakpoint
ALTER TABLE "characteristics" RENAME COLUMN "tamanho_pe" TO "shoe_size";--> statement-breakpoint
ALTER TABLE "characteristics" RENAME COLUMN "tatuagens" TO "tattoos";--> statement-breakpoint
ALTER TABLE "characteristics" RENAME COLUMN "fumante" TO "smoker";--> statement-breakpoint
ALTER TABLE "locations" RENAME COLUMN "pessoa_id" TO "companion_id";--> statement-breakpoint
ALTER TABLE "locations" RENAME COLUMN "bairro" TO "neighborhood";--> statement-breakpoint
ALTER TABLE "locations" RENAME COLUMN "cidade" TO "city";--> statement-breakpoint
ALTER TABLE "locations" RENAME COLUMN "estado" TO "state";--> statement-breakpoint
ALTER TABLE "reviews" RENAME COLUMN "acompanhante_id" TO "companion_id";--> statement-breakpoint
ALTER TABLE "reviews" RENAME COLUMN "comentario" TO "comment";--> statement-breakpoint
ALTER TABLE "companions" DROP CONSTRAINT "acompanhantes_email_unique";--> statement-breakpoint
ALTER TABLE "characteristics" DROP CONSTRAINT "caracteristicas_pessoa_id_acompanhantes_id_fk";
--> statement-breakpoint
ALTER TABLE "locations" DROP CONSTRAINT "localizacao_pessoa_id_acompanhantes_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_acompanhante_id_acompanhantes_id_fk";
--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "country" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "slug" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "characteristics" ADD CONSTRAINT "characteristics_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "companions_price_idx" ON "companions" USING btree ("price");--> statement-breakpoint
CREATE INDEX "companions_age_idx" ON "companions" USING btree ("age");--> statement-breakpoint
CREATE INDEX "companions_verified_idx" ON "companions" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "characteristics_companion_idx" ON "characteristics" USING btree ("companion_id");--> statement-breakpoint
CREATE INDEX "characteristics_ethnicity_idx" ON "characteristics" USING btree ("ethnicity");--> statement-breakpoint
CREATE INDEX "characteristics_eyes_idx" ON "characteristics" USING btree ("eye_color");--> statement-breakpoint
CREATE INDEX "characteristics_hair_idx" ON "characteristics" USING btree ("hair_color");--> statement-breakpoint
CREATE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "locations_city_state_idx" ON "locations" USING btree ("state","city");--> statement-breakpoint
CREATE INDEX "locations_companion_idx" ON "locations" USING btree ("companion_id");--> statement-breakpoint
CREATE INDEX "reviews_companion_idx" ON "reviews" USING btree ("companion_id");--> statement-breakpoint
ALTER TABLE "companions" ADD CONSTRAINT "companions_email_unique" UNIQUE("email");
CREATE TABLE "acompanhantes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"descricao" text,
	"preco" integer NOT NULL,
	"idade" integer NOT NULL,
	"genero" varchar(50) NOT NULL,
	"identidade_genero" varchar(100),
	"idiomas" varchar(255),
	"verificada" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "acompanhantes_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "caracteristicas" (
	"id" serial PRIMARY KEY NOT NULL,
	"pessoa_id" integer NOT NULL,
	"peso" numeric(5, 2),
	"altura" numeric(3, 2),
	"etnia" varchar(50),
	"cor_olhos" varchar(30),
	"cor_cabelo" varchar(30),
	"tamanho_cabelo" varchar(30),
	"tamanho_pe" integer,
	"silicone" boolean DEFAULT false,
	"tatuagens" boolean DEFAULT false,
	"piercings" boolean DEFAULT false,
	"fumante" boolean
);
--> statement-breakpoint
CREATE TABLE "localizacao" (
	"id" serial PRIMARY KEY NOT NULL,
	"pessoa_id" integer NOT NULL,
	"bairro" varchar(100),
	"cidade" varchar(100) NOT NULL,
	"estado" varchar(2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"acompanhante_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"comentario" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "caracteristicas" ADD CONSTRAINT "caracteristicas_pessoa_id_acompanhantes_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "public"."acompanhantes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localizacao" ADD CONSTRAINT "localizacao_pessoa_id_acompanhantes_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "public"."acompanhantes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_acompanhante_id_acompanhantes_id_fk" FOREIGN KEY ("acompanhante_id") REFERENCES "public"."acompanhantes"("id") ON DELETE no action ON UPDATE no action;
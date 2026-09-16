-- Edições de perfil ficam em espera sem tirar o anúncio do ar.
--
-- Antes disto, guardar uma edição escrevia por cima do perfil e punha
-- verified = false, ou seja, a acompanhante desaparecia do site até um admin
-- a aprovar. Quem já tinha sido aprovada uma vez perdia visibilidade por
-- causa de uma mudança de preço ou de uma vírgula na descrição.
--
-- Agora as alterações de quem já está aprovada ficam guardadas à parte, em
-- JSON, e só são escritas no perfil quando o admin aprovar. O visitante
-- continua a ver a versão aprovada anteriormente.

CREATE TABLE IF NOT EXISTS "companion_pending_edits" (
  "companion_id" integer PRIMARY KEY
    REFERENCES "companions"("id") ON DELETE CASCADE,
  -- Valores propostos, no mesmo formato do formulário de registo.
  "payload" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Sem políticas: a aplicação liga-se como "postgres", que ignora RLS, e o
-- cliente Supabase da chave pública nunca lê tabelas, só ficheiros. Assim a
-- tabela fica inacessível pela API REST pública sem afectar o site.
ALTER TABLE "companion_pending_edits" ENABLE ROW LEVEL SECURITY;

-- Fotos carregadas durante uma edição não podem aparecer no site antes de
-- serem vistas. As que já existem hoje são, por definição, as aprovadas.
ALTER TABLE "images"
  ADD COLUMN IF NOT EXISTS "pending_approval" boolean DEFAULT false NOT NULL;

-- Índice parcial: só interessa encontrar depressa as que estão por aprovar,
-- que são sempre poucas face ao total.
CREATE INDEX IF NOT EXISTS "images_pending_approval_idx"
  ON "images" ("companion_id")
  WHERE "pending_approval";

-- Liga, de forma opcional, um conto ao perfil de uma acompanhante.
--
-- Serve para quem acaba de ler ter um caminho directo para o anúncio: o
-- conto desperta o interesse e o perfil recebe-o, em vez de a leitura acabar
-- num beco sem saída.
--
-- ON DELETE SET NULL, e não CASCADE: apagar um perfil não pode levar o conto
-- atrás. O texto continua a valer por si, apenas deixa de ter ligação.

ALTER TABLE "stories"
  ADD COLUMN IF NOT EXISTS "companion_id" integer
  REFERENCES "companions"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "stories_companion_idx"
  ON "stories" ("companion_id")
  WHERE "companion_id" IS NOT NULL;

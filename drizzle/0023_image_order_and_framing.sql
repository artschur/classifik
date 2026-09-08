-- Ordem das fotos escolhida pela anunciante e enquadramento não destrutivo.
-- Antes disto a tabela não tinha coluna de ordem nenhuma: a ordem que aparecia
-- no perfil era a de inserção, por isso reorganizar obrigava a apagar tudo e
-- voltar a carregar. As queries paginadas também usavam LIMIT/OFFSET sem
-- ORDER BY, o que permitia repetir ou saltar fotos entre páginas.

ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "position" integer DEFAULT 0 NOT NULL;
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "focal_x" integer DEFAULT 50 NOT NULL;
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "focal_y" integer DEFAULT 50 NOT NULL;
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "zoom" integer DEFAULT 100 NOT NULL;

-- Preserva a ordem que cada perfil tem hoje, que é a de carregamento.
WITH ordenadas AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "companion_id"
      ORDER BY "created_at" ASC, "id" ASC
    ) - 1 AS "pos"
  FROM "images"
)
UPDATE "images"
SET "position" = "ordenadas"."pos"
FROM "ordenadas"
WHERE "images"."id" = "ordenadas"."id";

CREATE INDEX IF NOT EXISTS "images_companion_position_idx"
  ON "images" ("companion_id", "position");

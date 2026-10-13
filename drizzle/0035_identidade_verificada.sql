-- O selo "Verificada" passa a ter campo próprio.
--
-- Até aqui "verified" queria dizer duas coisas: o perfil está publicado e a
-- identidade foi confirmada pelo documento. As candidatas importadas podem
-- ficar online com consentimento mas sem documento, e não podem aparecer
-- como verificadas. Fica:
--   verified           publicado (aprovado pelo admin), como sempre
--   identity_verified  documento e vídeo vistos pelo admin: mostra o selo
--
-- Quem já está no ar hoje mantém o selo, como combinado.
--
-- ORDEM: correr ANTES do deploy do código que usa a coluna. É uma coluna nova
-- com valor por omissão, por isso o código actual continua a funcionar.

ALTER TABLE "companions"
  ADD COLUMN IF NOT EXISTS "identity_verified" boolean DEFAULT false NOT NULL;

UPDATE "companions" SET "identity_verified" = true WHERE "verified" = true;

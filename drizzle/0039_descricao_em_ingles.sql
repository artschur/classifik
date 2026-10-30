-- Descrição dos perfis em inglês, para a versão /en do site.
--
-- As anunciantes escrevem em português. A tradução é feita automaticamente
-- (Google Cloud Translation) quando o perfil é aprovado ou quando o texto
-- publicado muda, e o admin pode revê-la na aprovação ou no separador
-- "Inglês" do /verify. Fica:
--   short_description_en / description_en
--                         as duas descrições em inglês. A null, a página
--                         inglesa mostra o português com um aviso
--   translation_source    impressão digital (sha256) do texto em português
--                         que foi traduzido. Se o texto publicado mudar, a
--                         tradução fica desactualizada e é refeita
--   translation_status    'auto' ou 'revisto'
--   translated_at         quando foi traduzido ou revisto
--
-- ORDEM: correr ANTES do deploy do código que usa as colunas. São colunas
-- novas e opcionais, por isso o código actual continua a funcionar.

ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "short_description_en" text;
ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "description_en" text;
ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "translation_source" text;
ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "translation_status" varchar(20);
ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "translated_at" timestamp;

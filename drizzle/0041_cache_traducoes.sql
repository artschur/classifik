-- Cache das traduções das descrições dos perfis (lib/traducao-perfis.ts).
--
-- Cada texto traduzido pelo Google fica guardado pela sua impressão digital
-- (sha256 da descrição curta + descrição). Assim o mesmo texto nunca é pago
-- duas vezes: abrir a aba "Inglês" de um card da fila várias vezes, aprovar
-- depois de rever, ou carregar de novo em "Traduzir os que faltam" usa a
-- tradução já feita.
--
-- ORDEM: correr ANTES do deploy. Se a tabela não existir, o código traduz na
-- mesma (sem poupar), por isso nada parte.

CREATE TABLE IF NOT EXISTS "translation_cache" (
  "fonte" text PRIMARY KEY,
  "short_en" text,
  "desc_en" text,
  "original" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

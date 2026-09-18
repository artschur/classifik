-- Permite ao admin retirar um anúncio do ar e devolvê-lo à fila de verificação.
--
-- Até agora isso só se fazia à mão na base de dados. O problema de fazê-lo
-- apenas com verified = false é que a fila exige documento de verificação
-- para alguém aparecer, e há perfis aprovados que já não têm documento
-- guardado: desverificá-los tirava-os do site sem os fazer aparecer na fila,
-- ou seja, ficavam presos sem forma de voltar pela interface. Foi exactamente
-- o que aconteceu na desverificação em massa.
--
-- Esta coluna marca "foi o admin que a mandou para revisão", e a fila passa a
-- incluir essas independentemente de documentos. A aprovação volta a limpá-la.

ALTER TABLE "companions"
  ADD COLUMN IF NOT EXISTS "sent_to_review_at" timestamp;

CREATE INDEX IF NOT EXISTS "companions_sent_to_review_idx"
  ON "companions" ("sent_to_review_at")
  WHERE "sent_to_review_at" IS NOT NULL;

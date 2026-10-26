-- Registo em passos, verificação adiável e recusa sem apagar.
--
-- O perfil passa a entrar na fila do admin logo que é criado (primeira foto),
-- com ou sem vídeo e documento. A verificação pode ficar para depois, e a
-- recusa deixa de apagar o perfil. Fica:
--   submitted_at              entrou na fila. Os registos antigos ficam a null
--                             e por isso fora da fila, a não ser que enviem
--                             documento, como até aqui
--   rejected_at / rejection_reason
--                             recusado pelo admin, com o motivo que ela vê
--   terms_accepted_at         declarou ter 18 anos ou mais e aceitou os termos
--   identity_verified_at / _by / _method
--                             quando, quem e por que via o selo foi dado
--                             ('documento' ou 'whatsapp'). Só o admin lê
--   documents.status          pendente, aprovado ou recusado. Até aqui só havia
--                             o booleano verified, que não distinguia recusado
--                             de por rever
--   documents.reviewed_by     admin que decidiu
--
-- ORDEM: correr ANTES do deploy do código que usa as colunas. São colunas
-- novas, todas opcionais ou com valor por omissão, por isso o código actual
-- continua a funcionar.

ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp;
ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp;
ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "rejection_reason" text;
ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "terms_accepted_at" timestamp;
ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "identity_verified_at" timestamp;
ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "identity_verified_by" text;
ALTER TABLE "companions" ADD COLUMN IF NOT EXISTS "identity_verified_method" varchar(20);

ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'pendente' NOT NULL;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "reviewed_by" text;

UPDATE "documents" SET "status" = 'aprovado' WHERE "verified" = true;

-- Preço e características deixam de ser obrigatórios na base.
--
-- Os perfis criados pelo admin para candidatas a anunciante só exigem nome,
-- descrição, fotos e WhatsApp; o resto pode faltar até ela completar o
-- registo. O formulário de registo normal continua a exigir estes campos,
-- por isso nada muda para quem se regista sozinha. Onde faltarem, o site
-- mostra "sob consulta" (preço) ou não mostra a característica.
--
-- ORDEM: correr ANTES do deploy do código que grava estes campos vazios. O
-- código actual continua a funcionar com eles opcionais.

ALTER TABLE "companions" ALTER COLUMN "price" DROP NOT NULL;

ALTER TABLE "characteristics" ALTER COLUMN "weight" DROP NOT NULL;
ALTER TABLE "characteristics" ALTER COLUMN "height" DROP NOT NULL;
ALTER TABLE "characteristics" ALTER COLUMN "ethnicity" DROP NOT NULL;
ALTER TABLE "characteristics" ALTER COLUMN "hair_color" DROP NOT NULL;

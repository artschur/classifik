-- Perfis de demonstração: aparecem no site como qualquer outro, mas os
-- botões de contacto não levam a lado nenhum.
--
-- São perfis colocados de propósito, sem pessoa por trás. Partilhavam todos
-- o mesmo número de telefone, que é o da própria Onesugar, por isso quem
-- carregasse em "Conversar no WhatsApp" acabava a falar connosco a pensar
-- que falava com a acompanhante. Os endereços de Instagram apontam para
-- contas de terceiros, com o mesmo problema.
--
-- A marca fica numa coluna e não numa lista de identificadores no código:
-- assim marcar ou desmarcar um perfil é uma linha de SQL, não uma publicação.

ALTER TABLE "companions"
  ADD COLUMN IF NOT EXISTS "is_demo" boolean DEFAULT false NOT NULL;

-- Os quatro que existem hoje, pelos identificadores. Seria mais curto
-- apanhá-los pelo número de telefone que partilham, mas este ficheiro fica
-- num repositório público e um número não tem de lá estar; os
-- identificadores de perfil já aparecem nos endereços do site.
UPDATE "companions"
SET "is_demo" = true
WHERE "id" IN (181, 182, 183, 184);

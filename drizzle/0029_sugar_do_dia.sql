-- Sugar do dia: destaque único no hero da homepage.
--
-- Já existia uma tentativa disto a reaproveitar plan_type = 'do_dia', mas
-- plan_type também decide o selo de plano nas listagens, a ordenação por
-- plano e quem entra no carrossel do topo, e é reescrito sempre que um
-- webhook do Stripe confirma uma assinatura. Usar o mesmo campo para duas
-- coisas quebrava as duas: marcar alguém como "do dia" apagava o VIP dela em
-- todo o resto do site, e a próxima renovação apagava o "do dia" sem avisar
-- ninguém. Fica numa coluna própria, só para isto.

ALTER TABLE "companions"
  ADD COLUMN IF NOT EXISTS "is_sugar_of_day" boolean DEFAULT false NOT NULL;

-- Só pode haver uma de cada vez. A aplicação já garante isto ao trocar
-- (desmarca a anterior e marca a nova numa única transacção), mas o índice
-- fica como rede de segurança contra um bug ou uma escrita directa na base.
CREATE UNIQUE INDEX IF NOT EXISTS "companions_single_sugar_of_day"
  ON "companions" ((is_sugar_of_day))
  WHERE is_sugar_of_day = true;

-- Limpa a tentativa anterior: devolve o plano real a quem tinha ficado
-- marcada no campo errado. É um perfil de demonstração, sem conta Stripe por
-- trás, por isso 'free' é o valor neutro — não há assinatura para repor.
UPDATE "companions" SET "plan_type" = 'free' WHERE "plan_type" = 'do_dia';

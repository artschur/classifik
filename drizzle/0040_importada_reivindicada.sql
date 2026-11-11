-- Importadas reivindicadas: novo estado 'reivindicado' nas candidatas.
--
-- Os perfis importados foram criados aprovados e em pausa, para ficarem
-- escondidos até cada anunciante autorizar. Ao aceitar o convite, a
-- candidata passa a 'reivindicado' (se o perfil ainda estiver nessa pausa):
-- a próxima aprovação no /verify põe o perfil no ar e devolve o estado a
-- 'publicado'. Uma pausa ou reactivação feita à mão (por ela ou pelo admin)
-- também o devolve a 'publicado', e a aprovação deixa de mexer na pausa.
--
-- ORDEM: correr ANTES do deploy do código. Só alarga os valores permitidos,
-- por isso o código actual continua a funcionar.

ALTER TABLE staging.candidatos DROP CONSTRAINT IF EXISTS candidatos_status_check;
ALTER TABLE staging.candidatos ADD CONSTRAINT candidatos_status_check
  CHECK (status IN ('candidato', 'contactado', 'autorizado', 'publicado', 'reivindicado', 'recusado'));

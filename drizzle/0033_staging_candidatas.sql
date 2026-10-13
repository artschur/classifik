-- Candidatas a anunciante, à espera de contacto.
--
-- Ficam num schema próprio, fora de "public", e nunca são lidas por páginas
-- do site. Só passam a perfil (public.companions) quando a própria pessoa
-- autoriza, e só aparecem no site depois de o admin publicar. Quem recusar é
-- apagada; quem não responder é apagada quando chegar a data de expira_em.
--
-- Estados:
--   candidato   importada, ainda ninguém falou com ela
--   contactado  abordada, sem resposta ou a pensar
--   autorizado  deu consentimento (registado nos campos consentimento_*)
--   publicado   perfil criado e publicado (companion_id preenchido)
--   recusado    disse que não: a linha é apagada logo a seguir
--
-- Aplicar à mão no SQL Editor do Supabase. O schema "staging" NÃO deve ser
-- acrescentado aos "Exposed schemas" da API do projecto.

CREATE SCHEMA IF NOT EXISTS staging;

CREATE TABLE IF NOT EXISTS staging.candidatos (
  id text PRIMARY KEY,
  status text NOT NULL DEFAULT 'candidato'
    CHECK (status IN ('candidato', 'contactado', 'autorizado', 'publicado', 'recusado')),

  -- Dados da candidata
  nome_anuncio text NOT NULL,                -- título do anúncio, não o nome dela
  telefone text NOT NULL,                    -- +351XXXXXXXXX
  whatsapp boolean NOT NULL DEFAULT false,
  cidade text,                               -- como vinha no anúncio
  zona text,
  city_id integer REFERENCES public.cities(id),  -- distrito da OneSugar
  idade_declarada integer,                   -- limite de baixo do escalão do anúncio, não a idade real
  idade_texto text,                          -- escalão tal como vinha ("18/23")
  nacionalidade text,
  idiomas text[],
  horario text,
  descricao text,
  olhos text,
  altura text,                               -- texto livre ("1,62 M"); convertido ao criar o perfil
  peso text,
  categorias text[],
  fotos_url text[],                          -- endereços originais das fotos (cópias em fotos_guardadas, drizzle/0034)
  n_fotos integer,
  origens jsonb NOT NULL,
  n_fontes integer NOT NULL DEFAULT 1,
  flags text[],
  pontuacao numeric(5, 1),

  -- Contacto e consentimento
  contactado_em timestamptz,
  consentimento_em timestamptz,
  consentimento_canal text,                  -- whatsapp, chamada, email...
  consentimento_notas text,
  consentimento_admin text,                  -- Clerk id de quem registou

  -- Perfil criado a partir desta candidata
  companion_id integer REFERENCES public.companions(id) ON DELETE SET NULL,

  -- Convite para ela reclamar o perfil com a conta dela. Só se guarda o hash
  -- do código: quem ler a tabela não consegue usar o link. Uso único.
  convite_token_hash text UNIQUE,
  convite_expira_em timestamptz,
  reivindicado_em timestamptz,               -- quando ligou a conta Clerk dela

  expira_em timestamptz,                     -- limpeza de quem não responde
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS candidatos_telefone_idx ON staging.candidatos (telefone);
CREATE INDEX IF NOT EXISTS candidatos_status_idx ON staging.candidatos (status);
CREATE INDEX IF NOT EXISTS candidatos_city_idx ON staging.candidatos (city_id);

-- Fechado a tudo o que não seja o servidor. A aplicação liga-se como
-- "postgres", que ignora RLS; os papéis da API pública não vêem nada.
ALTER TABLE staging.candidatos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA staging FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA staging FROM anon, authenticated;

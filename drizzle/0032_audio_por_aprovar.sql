-- Áudio novo de um perfil já aprovado passa pela fila de verificação.
--
-- Até aqui o áudio gravado ia directo para o perfil público, sem ninguém o
-- ouvir. Agora, como já acontece com as fotos novas, fica marcado como por
-- aprovar e o perfil continua a mostrar o áudio que já estava aprovado. Na
-- aprovação o novo substitui o antigo; na recusa o novo é apagado.
--
-- Os áudios que já existem entram como aprovados (false): estão no ar hoje e
-- assim continuam.
--
-- ORDEM: correr ANTES do deploy do código que usa esta coluna. É só uma
-- coluna nova com valor por omissão, por isso o código actual continua a
-- funcionar com ela lá.

ALTER TABLE "audio_recordings"
  ADD COLUMN IF NOT EXISTS "pending_approval" boolean DEFAULT false NOT NULL;

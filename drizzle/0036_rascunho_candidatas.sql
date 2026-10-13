-- Rascunho do perfil de cada candidata.
--
-- O admin prepara o perfil no separador "Importadas" do /verify (nome a
-- mostrar, idade, preço, características, descrição, fotos e a ordem delas)
-- antes de haver consentimento, e volta a ele quantas vezes precisar. Fica
-- guardado aqui, no formato do formulário de aprovação, e só passa para
-- public.companions quando o perfil é aprovado.
--
-- Aplicar à mão no SQL Editor do Supabase.

ALTER TABLE staging.candidatos
  ADD COLUMN IF NOT EXISTS rascunho jsonb;

-- Fotos das candidatas guardadas num bucket privado.
--
-- Os endereços originais das fotos deixam de funcionar com o tempo. Para o
-- admin conseguir rever cada candidata até ao contacto, as fotos passam a
-- ser copiadas para o bucket "candidatas".
--
-- O bucket é PRIVADO: nada lá dentro abre por endereço público. O admin vê
-- as fotos no /verify por endereços assinados, gerados no servidor. Quando
-- uma candidata recusa, a pasta dela é apagada; quando é publicada, as fotos
-- que ela aceitar passam para o bucket público "images".
--
-- Aplicar à mão no SQL Editor do Supabase, antes de copiar as fotos.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('candidatas', 'candidatas', false, 10485760, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- Caminhos no bucket "candidatas", pela ordem do anúncio, sem repetidas.
ALTER TABLE staging.candidatos
  ADD COLUMN IF NOT EXISTS fotos_guardadas text[];

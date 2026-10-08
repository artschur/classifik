-- O papel anónimo deixa de poder escrever no bucket "images".
--
-- As fotos dos perfis, os áudios e as imagens dos contos vivem neste bucket.
-- Havia quatro políticas que davam a qualquer papel, incluindo o anónimo,
-- leitura, envio, alteração e remoção de tudo o que lá está. Com a chave
-- anónima dava para apagar as fotos de todos os perfis ou substituí-las por
-- outra coisa, e listar o bucket inteiro, incluindo fotos ainda por aprovar.
--
-- A aplicação passou a escrever com a chave service role, no servidor, e
-- cada função confirma de quem é o ficheiro. Ninguém escreve no Storage a
-- partir do navegador.
--
-- O bucket continua público: os endereços públicos das fotos abrem sem
-- política nenhuma, que é tudo o que o site precisa para as mostrar.
--
-- ORDEM: correr só depois de estar em produção o código que usa a service
-- role para as fotos, o áudio e os contos. Antes disso, enviar e apagar fotos
-- no registo, gravar áudio e publicar contos deixam de funcionar.
--
-- Aplicar à mão no SQL Editor do Supabase (o schema storage não é gerido
-- pelo Drizzle).

DROP POLICY IF EXISTS "allow all 1ffg0oo_0" ON storage.objects; -- SELECT
DROP POLICY IF EXISTS "allow all 1ffg0oo_1" ON storage.objects; -- INSERT
DROP POLICY IF EXISTS "allow all 1ffg0oo_2" ON storage.objects; -- UPDATE
DROP POLICY IF EXISTS "allow all 1ffg0oo_3" ON storage.objects; -- DELETE

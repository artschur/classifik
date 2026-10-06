-- Documentos de identidade deixam de ser públicos.
--
-- Estado encontrado: o bucket "documents" (documentos de identidade e vídeos
-- de verificação) estava marcado como público, e havia políticas no Storage
-- que davam ao papel anónimo leitura de todos os ficheiros de todos os
-- buckets, e envio, alteração e remoção no bucket "documents". Quem tivesse o
-- endereço de um documento abria-o sem sessão nem chave; quem tivesse a chave
-- anónima podia listá-los, substituí-los e apagá-los.
--
-- A aplicação passou a ler e escrever estes ficheiros com a chave service
-- role, no servidor, e o admin vê-os por endereços assinados que expiram.
-- Nada no site depende destas políticas.
--
-- ORDEM: correr só depois de estar em produção o código que usa a service
-- role (SUPABASE_SERVICE_ROLE_KEY configurada na Vercel). Antes disso, o
-- envio de documentos no registo e a página /verify deixam de funcionar.
--
-- Não toca no bucket "images": continua público para leitura, que é o que o
-- site precisa para mostrar as fotos. As políticas de escrita anónima nesse
-- bucket são tratadas à parte.
--
-- Aplicar à mão no SQL Editor do Supabase (o schema storage não é gerido
-- pelo Drizzle).

UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- Leitura de tudo, em todos os buckets, por qualquer papel. O bucket "images"
-- tem política de leitura própria e, sendo público, nem precisa dela para os
-- endereços públicos das fotos.
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;

-- Envio para qualquer bucket, sem condição.
DROP POLICY IF EXISTS "allow insert" ON storage.objects;

-- Políticas do bucket "documents" (leitura para "authenticated" do Supabase
-- Auth, que o site não usa — o login é pelo Clerk — e escrita para todos).
DROP POLICY IF EXISTS "allow read flreew_0" ON storage.objects;
DROP POLICY IF EXISTS "allow read flreew_1" ON storage.objects;
DROP POLICY IF EXISTS "allow read flreew_2" ON storage.objects;
DROP POLICY IF EXISTS "allow read flreew_3" ON storage.objects;

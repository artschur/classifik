-- Fecha o acesso público às tabelas pela API REST do Supabase.
--
-- Estado encontrado: nenhuma das 14 tabelas tinha RLS activo, e o papel
-- "anon" tinha SELECT, INSERT, UPDATE e DELETE em todas elas. Como a chave
-- anónima está no JavaScript público do site, qualquer pessoa na internet
-- podia, com um único pedido HTTP a <projecto>.supabase.co/rest/v1/<tabela>:
--
--   - ler emails, telefones e descrições de todas as acompanhantes;
--   - ler a tabela de documentos de verificação de identidade;
--   - ler identificadores de cliente e subscrição do Stripe;
--   - marcar qualquer perfil como verified = true;
--   - apagar todas as linhas de todas as tabelas.
--
-- Activar RLS sem políticas nenhumas bloqueia os papéis "anon" e
-- "authenticated" por completo. Não afecta o site: a aplicação liga-se pela
-- DATABASE_URL como "postgres", que tem rolbypassrls, e o cliente Supabase
-- só é usado para ficheiros (supabase.storage), nunca para ler tabelas.

ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audio_recordings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blocked_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "characteristics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companions_verified_backup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "neighborhoods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

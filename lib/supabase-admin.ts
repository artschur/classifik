import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente do Supabase com a chave service role, só para o servidor.
 *
 * O bucket `documents` é privado: guarda documentos de identidade e vídeos de
 * verificação, e com a chave anónima não se lê nem se escreve nada lá. Esta
 * chave ignora as políticas do Storage, por isso nunca pode chegar ao
 * navegador — o `server-only` acima parte o build se alguém a importar num
 * componente de cliente.
 *
 * É criado na primeira chamada e não ao carregar o módulo: assim um ambiente
 * sem a variável continua a fazer build e só falha a função que precisa dela,
 * com uma mensagem que diz o que falta.
 */
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY em falta: sem ela não há acesso aos documentos.',
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/**
 * Validade dos endereços assinados dos documentos. Uma hora chega para o
 * admin rever a fila com a página aberta; um endereço copiado ou guardado no
 * histórico deixa de servir ao fim desse tempo, e só um admin com sessão
 * consegue pedir outro.
 */
const DOCUMENT_URL_TTL_SECONDS = 60 * 60;

/**
 * Bucket onde o ficheiro está. Quase tudo vive em `documents`, mas há vídeos
 * de verificação antigos que foram para `images`, e o único sítio que o diz é
 * o endereço público gravado no registo.
 */
function documentBucket(publicUrl: string): 'documents' | 'images' {
  return publicUrl.includes('/object/public/images/') ? 'images' : 'documents';
}

/**
 * Endereço temporário para ver um documento. Devolve null se o ficheiro já
 * não existir no Storage, para o ecrã mostrar o documento como indisponível
 * em vez de partir.
 */
export async function signDocumentUrl(doc: {
  storage_path: string;
  public_url: string;
}): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(documentBucket(doc.public_url))
    .createSignedUrl(doc.storage_path, DOCUMENT_URL_TTL_SECONDS);

  if (error || !data) {
    console.error('Falha ao assinar endereço de documento:', error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Apaga todos os ficheiros dentro de uma "pasta" de um bucket. O SDK só apaga
 * por caminho exacto: passar a pasta a `remove` não apaga nada e não dá erro,
 * por isso é preciso listar primeiro.
 */
export async function removeStorageFolder(bucket: string, prefix: string) {
  const storage = getSupabaseAdmin().storage.from(bucket);
  const { data: files, error } = await storage.list(prefix, { limit: 1000 });

  if (error || !files || files.length === 0) return;

  // Entradas de sub-pasta vêm sem `id` (são sintéticas); só interessam ficheiros reais.
  const paths = files.filter((f) => f.id).map((f) => `${prefix}${f.name}`);

  if (paths.length > 0) {
    await storage.remove(paths);
  }
}

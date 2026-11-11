// Só no servidor: chamado pela rota /api/admin/phone-search. Não é uma server
// action de propósito: as acções do /verify correm uma de cada vez, e a busca
// ficava à espera das que os cartões da fila disparam ao abrir a página.
import { auth } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { isAdmin } from '@/components/header';

/** Um perfil (companions), em qualquer estado. */
export type ResultadoPerfil = {
  tipo: 'perfil';
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  cidade: string | null;
  aprovado: boolean;
  pausado: boolean;
  selo: boolean;
  recusado: boolean;
  motivoRecusa: string | null;
  /** Criado pela equipa e ainda sem conta dela. */
  importadaSemConta: boolean;
  /** Estado da candidata de origem, se veio da importação. */
  estadoImportacao: string | null;
  alteracoesPorRever: boolean;
  criadoEm: string | null;
};

/** Candidata importada que ainda não tem perfil. */
export type ResultadoCandidata = {
  tipo: 'candidata';
  id: string;
  nome: string;
  telefone: string;
  distrito: string | null;
  estado: string;
};

export type ResultadoBusca = ResultadoPerfil | ResultadoCandidata;

const MAX = 30;

/**
 * Busca de admin por número de telefone, em todos os perfis (no ar, em pausa,
 * por aprovar, recusados, importados) e nas candidatas importadas sem perfil.
 * Compara só os dígitos, por isso aceita o número com ou sem indicativo,
 * espaços ou traços.
 */
export async function searchByPhone(
  termo: string,
): Promise<{ success: true; resultados: ResultadoBusca[]; limitado: boolean } | { success: false; error: string }> {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) return { success: false, error: 'Não autorizado' };

  let digitos = (termo ?? '').replace(/\D/g, '');
  if (digitos.length < 6) {
    return { success: false, error: 'Escreva pelo menos 6 dígitos.' };
  }
  // Com indicativo (ex.: 351 925 801 096), basta o número nacional: assim
  // encontra-se também quem o guardou sem indicativo.
  if (digitos.length > 9) digitos = digitos.slice(-9);
  const padrao = `%${digitos}%`;

  const [perfis, candidatas] = await Promise.all([
    db.execute<{
      id: number;
      name: string;
      phone: string;
      email: string | null;
      city: string | null;
      verified: boolean;
      paused: boolean;
      identity_verified: boolean;
      rejected_at: Date | null;
      rejection_reason: string | null;
      auth_id: string;
      estado_importacao: string | null;
      alteracoes: boolean;
      created_at: Date | null;
    }>(sql`
      select c.id, c.name, c.phone, c.email, ci.city, c.verified, c.paused, c.identity_verified,
        c.rejected_at, c.rejection_reason, c.auth_id, c.created_at,
        (select s.status from staging.candidatos s where s.companion_id = c.id limit 1) as estado_importacao,
        (exists (select 1 from companion_pending_edits e where e.companion_id = c.id)
          or exists (select 1 from images i where i.companion_id = c.id and i.pending_approval)) as alteracoes
      from companions c
      left join cities ci on ci.id = c.location_id
      where regexp_replace(coalesce(c.phone, ''), '\\D', '', 'g') like ${padrao}
      order by c.updated_at desc nulls last
      limit ${MAX + 1}`),
    db.execute<{
      id: string;
      nome_anuncio: string;
      telefone: string;
      distrito: string | null;
      status: string;
    }>(sql`
      select s.id, s.nome_anuncio, s.telefone, ci.city as distrito, s.status
      from staging.candidatos s
      left join cities ci on ci.id = s.city_id
      where s.companion_id is null
        and regexp_replace(coalesce(s.telefone, ''), '\\D', '', 'g') like ${padrao}
      order by s.atualizado_em desc nulls last
      limit ${MAX + 1}`),
  ]);

  const listaPerfis = Array.from(perfis);
  const listaCandidatas = Array.from(candidatas);

  const resultados: ResultadoBusca[] = [
    ...listaPerfis.slice(0, MAX).map(
      (p): ResultadoPerfil => ({
        tipo: 'perfil',
        id: p.id,
        nome: p.name,
        telefone: p.phone,
        email: p.email && !p.email.endsWith('.invalid') ? p.email : null,
        cidade: p.city,
        aprovado: p.verified,
        pausado: p.paused,
        selo: p.identity_verified,
        recusado: p.rejected_at !== null,
        motivoRecusa: p.rejection_reason,
        importadaSemConta: p.auth_id.startsWith('import_'),
        estadoImportacao: p.estado_importacao,
        alteracoesPorRever: p.alteracoes,
        criadoEm: p.created_at ? new Date(p.created_at).toISOString() : null,
      }),
    ),
    ...listaCandidatas.slice(0, MAX).map(
      (c): ResultadoCandidata => ({
        tipo: 'candidata',
        id: c.id,
        nome: c.nome_anuncio,
        telefone: c.telefone,
        distrito: c.distrito,
        estado: c.status,
      }),
    ),
  ];

  return {
    success: true,
    resultados,
    limitado: listaPerfis.length > MAX || listaCandidatas.length > MAX,
  };
}

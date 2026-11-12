// Só no servidor. Encontra os perfis cujo telefone contém um número, para a
// busca do /verify mostrar os cartões completos desses perfis.
import { auth } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { isAdmin } from '@/components/header';
import { isImportedAuthId } from '@/lib/imported-profiles';
import { previewToken } from '@/lib/preview-token';

const MAX = 30;

/** Só os dígitos; com indicativo, os 9 do número nacional. Vazio se for curto demais. */
export function digitosDaBusca(termo: string | null | undefined): string {
  let digitos = String(termo ?? '').replace(/\D/g, '');
  if (digitos.length > 9) digitos = digitos.slice(-9);
  return digitos.length >= 6 ? digitos : '';
}

/** O que a barra de controlos de admin (a mesma da página do perfil) precisa. */
export type ControlosDoPerfil = {
  companionId: number;
  name: string;
  paused: boolean;
  verified: boolean;
  identityVerified: boolean;
  /** Por que via foi dado o selo: só o admin a vê. */
  viaSelo: string | null;
  vipActive: boolean;
  isSugarOfDay: boolean;
  /** Criado pela equipa e ainda sem conta dela. */
  importadaSemConta: boolean;
  previewPath: string | null;
};

/**
 * Perfis (em qualquer estado: no ar, em pausa, por aprovar, recusados,
 * importados com ou sem conta) cujo telefone contém o número. Compara só os
 * dígitos, por isso aceita o número com ou sem indicativo, espaços ou traços.
 */
export async function perfisPorTelefone(
  termo: string,
): Promise<{ perfis: ControlosDoPerfil[]; limitado: boolean }> {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) throw new Error('Não autorizado');

  const digitos = digitosDaBusca(termo);
  if (!digitos) return { perfis: [], limitado: false };

  const linhas = await db.execute<{
    id: number;
    name: string;
    auth_id: string;
    paused: boolean;
    verified: boolean;
    identity_verified: boolean;
    via: string | null;
    vip_ativo: boolean;
    do_dia: boolean;
  }>(sql`
    select c.id, c.name, c.auth_id, c.paused, c.verified, c.identity_verified,
      c.identity_verified_method as via,
      -- plan_type = 'vip' fica gravado mesmo depois de expirar: a data é que decide.
      (c.plan_type = 'vip' and c.ad_expiration_date is not null and c.ad_expiration_date > now()) as vip_ativo,
      c.is_sugar_of_day as do_dia
    from companions c
    where regexp_replace(coalesce(c.phone, ''), '\\D', '', 'g') like ${`%${digitos}%`}
    order by c.updated_at desc nulls last
    limit ${MAX + 1}`);

  const todas = Array.from(linhas);
  return {
    perfis: todas.slice(0, MAX).map((l) => {
      const importada = isImportedAuthId(l.auth_id);
      return {
        companionId: l.id,
        name: l.name,
        paused: l.paused,
        verified: l.verified,
        identityVerified: l.identity_verified,
        viaSelo: l.identity_verified ? l.via : null,
        vipActive: Boolean(l.vip_ativo),
        isSugarOfDay: l.do_dia,
        importadaSemConta: importada,
        previewPath: importada ? `/companions/${l.id}?ver=${previewToken(l.id)}` : null,
      };
    }),
    limitado: todas.length > MAX,
  };
}

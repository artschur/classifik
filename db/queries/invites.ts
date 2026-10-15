import 'server-only';

import crypto from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db } from '..';
import { isImportedAuthId } from '@/lib/imported-profiles';

export type Invite =
  | { estado: 'valido'; companionId: number; nome: string }
  | { estado: 'invalido' | 'expirado' | 'reclamado' };

export const hashInvite = (codigo: string) => crypto.createHash('sha256').update(codigo).digest('hex');

/**
 * O convite que o admin enviou a uma candidata: válido enquanto não expirar
 * e enquanto o perfil ainda não estiver ligado a uma conta.
 */
export async function readInvite(codigo: string): Promise<Invite> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(codigo)) return { estado: 'invalido' };

  const rows = await db.execute<{
    companion_id: number | null;
    convite_expira_em: Date | null;
    auth_id: string | null;
    name: string | null;
  }>(sql`
    select c.companion_id, c.convite_expira_em, p.auth_id, p.name
    from staging.candidatos c
    left join public.companions p on p.id = c.companion_id
    where c.convite_token_hash = ${hashInvite(codigo)}`);
  const linha = Array.from(rows)[0];

  if (!linha || !linha.companion_id || !linha.auth_id) return { estado: 'invalido' };
  if (!isImportedAuthId(linha.auth_id)) return { estado: 'reclamado' };
  if (!linha.convite_expira_em || linha.convite_expira_em < new Date()) return { estado: 'expirado' };

  return { estado: 'valido', companionId: linha.companion_id, nome: linha.name ?? '' };
}

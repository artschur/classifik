import 'server-only';

import { sql } from 'drizzle-orm';
import { db } from '..';

/**
 * Pôr no ar um perfil criado pelo admin é o admin a confirmar que ela
 * autorizou por WhatsApp: o botão diz isso. Fica gravado como consentimento,
 * com a data e quem confirmou, para haver registo se alguém perguntar porque
 * é que o perfil está no site. Se já houver consentimento (registado antes ou
 * pelo convite), nada muda.
 */
export async function registarConsentimentoAoPublicar(
  executor: typeof db,
  companionId: number,
  adminId: string,
) {
  await executor.execute(sql`
    update staging.candidatos
    set consentimento_em = now(),
        consentimento_canal = 'whatsapp',
        consentimento_notas = 'Confirmado pelo admin ao pôr o perfil no ar',
        consentimento_admin = ${adminId},
        contactado_em = coalesce(contactado_em, now()),
        atualizado_em = now()
    where companion_id = ${companionId} and consentimento_em is null`);
}

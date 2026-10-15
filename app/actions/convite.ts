'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { audioRecordingsTable, companionsTable, documentsTable, imagesTable } from '@/db/schema';
import { readInvite } from '@/db/queries/invites';
import type { Locale } from '@/lib/i18n';

/**
 * Liga o perfil criado pelo admin à conta Clerk de quem abriu o convite.
 *
 * O convite é a prova de que é ela: só ela o recebeu. A partir daqui o perfil
 * é dela como o de qualquer anunciante, e usar o convite conta como
 * consentimento. No fim segue para o formulário de registo, já preenchido,
 * para completar o que falta.
 */
const ERROS = {
  pt: {
    semSessao: 'Entre na sua conta primeiro.',
    expirado: 'Este convite expirou. Peça um novo à equipa OneSugar.',
    reclamado: 'Este perfil já foi ligado a uma conta.',
    invalido: 'Convite inválido.',
    jaTemPerfil: 'Esta conta já tem um perfil de anunciante. Fale com a equipa OneSugar.',
    semEmail: 'A sua conta não tem email. Acrescente um e tente outra vez.',
    emailUsado: 'Este email já está a ser usado noutro perfil. Fale com a equipa OneSugar.',
    falha: 'Não foi possível ligar o perfil. Tente outra vez.',
  },
  en: {
    semSessao: 'Please sign in first.',
    expirado: 'This invitation has expired. Ask the OneSugar team for a new one.',
    reclamado: 'This profile is already linked to an account.',
    invalido: 'Invalid invitation.',
    jaTemPerfil: 'This account already has an advertiser profile. Please contact the OneSugar team.',
    semEmail: 'Your account has no email address. Add one and try again.',
    emailUsado: 'This email is already used by another profile. Please contact the OneSugar team.',
    falha: 'We could not link the profile. Please try again.',
  },
} as const;

export async function claimInvite(
  codigo: string,
  locale: Locale = 'pt',
): Promise<{ success: false; error: string }> {
  const e = ERROS[locale === 'en' ? 'en' : 'pt'];
  const { userId } = await auth();
  if (!userId) return { success: false, error: e.semSessao };

  const convite = await readInvite(codigo);
  if (convite.estado === 'expirado') return { success: false, error: e.expirado };
  if (convite.estado === 'reclamado') return { success: false, error: e.reclamado };
  if (convite.estado !== 'valido') return { success: false, error: e.invalido };

  const [jaTem] = await db
    .select({ id: companionsTable.id })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, userId))
    .limit(1);
  if (jaTem) return { success: false, error: e.jaTemPerfil };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;
  if (!email) return { success: false, error: e.semEmail };

  const id = convite.companionId;
  try {
    await db.transaction(async (tx) => {
      // A condição no auth_id impede que dois pedidos ao mesmo tempo liguem o
      // perfil a duas contas.
      const [ligado] = await tx
        .update(companionsTable)
        .set({ auth_id: userId, email, updated_at: new Date() })
        .where(sql`${companionsTable.id} = ${id} and ${companionsTable.auth_id} like 'import\\_%'`)
        .returning({ id: companionsTable.id });
      if (!ligado) throw new Error('reclamado');

      await tx.update(imagesTable).set({ authId: userId }).where(eq(imagesTable.companionId, id));
      await tx.update(audioRecordingsTable).set({ authId: userId }).where(eq(audioRecordingsTable.companionId, id));
      await tx.update(documentsTable).set({ authId: userId }).where(eq(documentsTable.companionId, id));

      await tx.execute(sql`
        update staging.candidatos
        set reivindicado_em = now(),
            convite_token_hash = null,
            consentimento_em = coalesce(consentimento_em, now()),
            consentimento_canal = coalesce(consentimento_canal, 'convite'),
            atualizado_em = now()
        where companion_id = ${id}`);
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : '';
    if (mensagem === 'reclamado') return { success: false, error: e.reclamado };
    if (/duplicate key|unique/i.test(mensagem)) return { success: false, error: e.emailUsado };
    console.error('Falha ao reclamar perfil:', error);
    return { success: false, error: e.falha };
  }

  // O perfil já está publicado: o registo conta como completo, e o documento
  // fica opcional (dá o selo). Sem isto o proxy prendia-a nos passos de
  // verificação antes de chegar ao formulário.
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true,
      isCompanion: true,
      isRegistrationComplete: true,
      hasUploadedDocs: true,
    },
  });

  revalidateTag('companion', 'max');
  revalidateTag('companions', 'max');
  revalidateTag('companions-filter', 'max');

  redirect('/companions/register');
}

"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companionsTable, audioRecordingsTable } from "@/db/schema";
import { cancelarSubscricoesNaStripe } from "@/db/queries/subscriptions";
import { setCompanionPaused } from "@/db/queries/companions";
import { removeStorageFolder } from "@/lib/supabase-admin";
import { getLocale } from "@/lib/locale.server";
import { localizeHref } from "@/lib/i18n";

// Frase de confirmação em cada idioma. Tem de bater com a do botão
// (components/manage-ad-actions.tsx).
const DELETE_CONFIRMATION_PHRASE = { pt: "APAGAR", en: "DELETE" } as const;

const MENSAGENS = {
  pt: {
    semSessao: "Não autenticada.",
    frase: "Frase de confirmação incorrecta.",
    semPerfil: "Perfil não encontrado.",
    subscricao: "Não foi possível cancelar a sua subscrição. Tente outra vez ou contacte o suporte.",
  },
  en: {
    semSessao: "You are not signed in.",
    frase: "The confirmation word is incorrect.",
    semPerfil: "Profile not found.",
    subscricao: "We could not cancel your subscription. Please try again or contact support.",
  },
} as const;

export async function togglePauseAd(paused: boolean) {
  const locale = await getLocale();
  const m = MENSAGENS[locale];
  const { userId } = await auth();
  if (!userId) throw new Error(m.semSessao);

  const result = await setCompanionPaused(userId, paused);
  revalidatePath("/profile");
  // O único erro de setCompanionPaused é perfil não encontrado.
  if (locale === "en" && !result.success) {
    return { ...result, error: m.semPerfil };
  }
  return result;
}

/**
 * Apaga definitivamente a conta da companion: cancela na Stripe as
 * subscrições que ainda podem cobrar (procuradas na própria Stripe), remove
 * ficheiros do storage (fotos, vídeo de verificação,
 * documentos, áudio), apaga a linha na base de dados — que arrasta consigo
 * características, fotos, documentos, avaliações, bloqueios e eventos de
 * analytics via cascade — e por fim apaga o utilizador no Clerk.
 *
 * Irreversível. Exige a frase de confirmação para reduzir o risco de um
 * clique acidental ou de uma chamada indevida ao action apagar a conta
 * sem intenção explícita.
 */
export async function deleteCompanionAccount(confirmationPhrase: string) {
  const locale = await getLocale();
  const m = MENSAGENS[locale];
  if (confirmationPhrase.trim().toUpperCase() !== DELETE_CONFIRMATION_PHRASE[locale]) {
    return { success: false, error: m.frase };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: m.semSessao };
  }

  const [companion] = await db
    .select({
      id: companionsTable.id,
      stripeCustomerId: companionsTable.stripe_customer_id,
    })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, userId))
    .limit(1);

  if (!companion) {
    return { success: false, error: m.semPerfil };
  }

  // 1. Cancela na Stripe tudo o que ainda pode cobrar esta conta: apagar os
  //    dados não pára a cobrança automática. Procura na própria Stripe, e não
  //    só na base, onde a subscrição pode nunca ter ficado registada. Se não
  //    der para cancelar, não se apaga nada: conta apagada com a cobrança a
  //    correr era o pior dos casos, e ela pode tentar outra vez.
  try {
    const { falhas } = await cancelarSubscricoesNaStripe({
      clerkId: userId,
      stripeCustomerId: companion.stripeCustomerId,
    });
    if (falhas.length > 0) {
      return {
        success: false,
        error: m.subscricao,
      };
    }
  } catch (error) {
    console.error("Falha ao procurar subscrições na Stripe ao apagar conta:", error);
    return {
      success: false,
      error: m.subscricao,
    };
  }

  // 2. Remove ficheiros do storage nas três localizações usadas pela conta.
  await Promise.allSettled([
    removeStorageFolder("images", `${userId}/`),
    removeStorageFolder("images", `audio/${userId}/`),
    removeStorageFolder("documents", `documents/${userId}/`),
  ]);

  // 3. audio_recordings não tem cascade a partir de companions — apagar à parte.
  await db
    .delete(audioRecordingsTable)
    .where(eq(audioRecordingsTable.authId, userId));

  // 4. Apaga a companion. Cascade trata de characteristics, images,
  //    documents, reviews, blocked_users e analytics_events (FK directa),
  //    e de payments/subscriptions (FK via stripe_customer_id).
  await db.delete(companionsTable).where(eq(companionsTable.id, companion.id));

  // 5. Apaga o utilizador no Clerk — sem isto ficaria uma conta "fantasma",
  //    capaz de entrar mas sem perfil nenhum.
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (error) {
    console.error("Falha ao apagar utilizador no Clerk:", error);
  }

  revalidateTag("companion", "max");
  revalidateTag("companions", "max");
  revalidateTag("companions-filter", "max");

  redirect(localizeHref("/", locale));
}

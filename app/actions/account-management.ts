"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companionsTable, audioRecordingsTable } from "@/db/schema";
import { stripe } from "@/db/stripe";
import { getActiveSubscriptionByClerkId } from "@/db/queries/subscriptions";
import { setCompanionPaused } from "@/db/queries/companions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const DELETE_CONFIRMATION_PHRASE = "APAGAR";

export async function togglePauseAd(paused: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticada.");

  const result = await setCompanionPaused(userId, paused);
  revalidatePath("/profile");
  return result;
}

/**
 * Apaga recursivamente todos os ficheiros dentro de uma "pasta" num bucket
 * do Supabase Storage. O SDK só apaga por caminho exacto — sem listar
 * primeiro, ficheiros ficariam órfãos no storage mesmo com a conta apagada.
 */
async function removeStorageFolder(bucket: string, prefix: string) {
  const { data: files, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (error || !files || files.length === 0) return;

  // Entradas de sub-pasta vêm sem `id` (são sintéticas); só interessam ficheiros reais.
  const paths = files.filter((f) => f.id).map((f) => `${prefix}${f.name}`);

  if (paths.length > 0) {
    await supabase.storage.from(bucket).remove(paths);
  }
}

/**
 * Apaga definitivamente a conta da companion: cancela subscrição activa no
 * Stripe, remove ficheiros do storage (fotos, vídeo de verificação,
 * documentos, áudio), apaga a linha na base de dados — que arrasta consigo
 * características, fotos, documentos, avaliações, bloqueios e eventos de
 * analytics via cascade — e por fim apaga o utilizador no Clerk.
 *
 * Irreversível. Exige a frase de confirmação para reduzir o risco de um
 * clique acidental ou de uma chamada indevida ao action apagar a conta
 * sem intenção explícita.
 */
export async function deleteCompanionAccount(confirmationPhrase: string) {
  if (confirmationPhrase.trim().toUpperCase() !== DELETE_CONFIRMATION_PHRASE) {
    return { success: false, error: "Frase de confirmação incorrecta." };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Não autenticada." };
  }

  const [companion] = await db
    .select({ id: companionsTable.id })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, userId))
    .limit(1);

  if (!companion) {
    return { success: false, error: "Perfil não encontrado." };
  }

  // 1. Cancela qualquer subscrição activa no Stripe — apagar os dados não
  //    pára a cobrança automática por si só.
  const activeSubscription = await getActiveSubscriptionByClerkId(userId);
  if (activeSubscription?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(
        activeSubscription.stripe_subscription_id,
      );
    } catch (error) {
      console.error(
        "Falha ao cancelar subscrição Stripe ao apagar conta:",
        error,
      );
    }
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

  redirect("/");
}

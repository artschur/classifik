"use server";

import { db } from "..";
import { audioRecordingsTable, companionsTable } from "../schema";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/components/header";
import { canRecordAudio } from "@/lib/audio-access";

const audioStorage = () => getSupabaseAdmin().storage.from("images");

/**
 * A conta e o perfil saem sempre da sessão, nunca do pedido: antes vinham do
 * navegador, e qualquer pessoa podia apagar e substituir o áudio de outra
 * anunciante passando o id dela.
 */
async function getSessionCompanion(): Promise<
    { clerkId: string; companionId: number; verified: boolean; } | null
> {
    const { userId } = await auth();
    if (!userId) return null;

    const [companion] = await db
        .select({ id: companionsTable.id, verified: companionsTable.verified })
        .from(companionsTable)
        .where(eq(companionsTable.auth_id, userId))
        .limit(1);

    return companion
        ? { clerkId: userId, companionId: companion.id, verified: companion.verified }
        : null;
}

/** Apaga áudios do Storage e da tabela. */
async function removeAudios(rows: { id: number; storagePath: string; }[]) {
    if (rows.length === 0) return;

    const { error } = await audioStorage().remove(rows.map((row) => row.storagePath));
    if (error) throw error;

    for (const row of rows) {
        await db.delete(audioRecordingsTable).where(eq(audioRecordingsTable.id, row.id));
    }
}

async function storeAudio(
    audioFile: File,
    clerkId: string,
    companionId: number,
    pendingApproval: boolean,
) {
    // O nome original vem do navegador; só entra a parte segura dele.
    const safeName = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `audio/${clerkId}/${Date.now()}-${safeName}`;

    const upload = await audioStorage().upload(fileName, audioFile, {
        cacheControl: "3600",
        upsert: true,
    });

    if (upload.error) {
        throw upload.error;
    }

    const { data: { publicUrl } } = audioStorage().getPublicUrl(fileName);

    await db.insert(audioRecordingsTable).values({
        authId: clerkId,
        companionId: companionId,
        storage_path: fileName,
        public_url: publicUrl,
        pending_approval: pendingApproval,
    });
}

/**
 * Grava o áudio da própria anunciante.
 *
 * Quem já está no ar fica com o áudio novo à espera do admin, e o perfil
 * continua a mostrar o aprovado até lá; gravar outra vez antes da revisão
 * substitui o que estava à espera. Quem ainda não foi aprovada não tem nada
 * publicado, por isso o áudio novo substitui logo o anterior e é revisto com
 * o resto do perfil.
 */
async function submitAudio(
    audioFile: File,
): Promise<{ success?: boolean; pendingReview?: boolean; error?: string; }> {
    try {
        const owner = await getSessionCompanion();
        if (!owner) {
            return { error: "Perfil não encontrado." };
        }
        if (!(await canRecordAudio(owner.clerkId))) {
            return { error: "O áudio está disponível no plano VIP." };
        }

        const ownAudios = and(
            eq(audioRecordingsTable.companionId, owner.companionId),
            eq(audioRecordingsTable.authId, owner.clerkId),
        );

        // Apaga o que vai ser substituído antes de gravar o novo. Antes as
        // duas coisas corriam em paralelo, e o apagar podia apanhar a linha
        // acabada de inserir, deixando o perfil sem áudio nenhum.
        const toReplace = await db
            .select({ id: audioRecordingsTable.id, storagePath: audioRecordingsTable.storage_path })
            .from(audioRecordingsTable)
            .where(
                owner.verified
                    ? and(ownAudios, eq(audioRecordingsTable.pending_approval, true))
                    : ownAudios,
            );

        await removeAudios(toReplace);
        await storeAudio(audioFile, owner.clerkId, owner.companionId, owner.verified);

        // A fila do /verify passa a incluí-la.
        revalidateTag("companion", "max");

        return { success: true, pendingReview: owner.verified };
    } catch (error) {
        console.error("Error uploading audio:", error);
        return {
            error: error instanceof Error ? error.message : "Failed to upload audio",
        };
    }
}

export async function uploadAudio({ audioFile }: { audioFile: File; }) {
    return submitAudio(audioFile);
}

export async function updateAudio({ audioFile }: { audioFile: File; }) {
    return submitAudio(audioFile);
}

/** O áudio que aparece no perfil público: só o aprovado. */
export async function getAudioUrlByCompanionId(companionId: number): Promise<{ id: number; publicUrl: string; } | null> {
    try {
        const [audioResults] = await db
            .select({
                id: audioRecordingsTable.id,
                publicUrl: audioRecordingsTable.public_url,
            })
            .from(audioRecordingsTable)
            .where(
                and(
                    eq(audioRecordingsTable.companionId, companionId),
                    eq(audioRecordingsTable.pending_approval, false),
                ),
            )
            .orderBy(desc(audioRecordingsTable.created_at))
            .limit(1);

        return audioResults ?? null;
    } catch (error) {
        console.error("Error fetching audio:", error);
        return null;
    }
}

/**
 * O áudio mais recente da própria anunciante, aprovado ou não, para a página
 * de gravação lhe dizer o que tem e se está à espera de aprovação.
 */
export async function getMyAudio(): Promise<
    { id: number; publicUrl: string; pendingApproval: boolean; } | null
> {
    const { userId } = await auth();
    if (!userId) return null;

    try {
        const [audioResults] = await db
            .select({
                id: audioRecordingsTable.id,
                publicUrl: audioRecordingsTable.public_url,
                pendingApproval: audioRecordingsTable.pending_approval,
            })
            .from(audioRecordingsTable)
            .where(eq(audioRecordingsTable.authId, userId))
            .orderBy(desc(audioRecordingsTable.created_at))
            .limit(1);

        return audioResults ?? null;
    } catch (error) {
        console.error("Error fetching audio:", error);
        return null;
    }
}

/**
 * Publica o áudio que estava à espera e apaga o que ele substitui. Chamada
 * pela aprovação do perfil. Só admin.
 */
export async function approvePendingAudio(
    companionId: number,
): Promise<{ success: boolean; error?: string; }> {
    const { userId } = await auth();
    if (!userId || !isAdmin(userId)) {
        return { success: false, error: "Não autorizado" };
    }

    const audios = await db
        .select({
            id: audioRecordingsTable.id,
            storagePath: audioRecordingsTable.storage_path,
            pending: audioRecordingsTable.pending_approval,
        })
        .from(audioRecordingsTable)
        .where(eq(audioRecordingsTable.companionId, companionId));

    if (!audios.some((audio) => audio.pending)) return { success: true };

    await removeAudios(audios.filter((audio) => !audio.pending));
    await db
        .update(audioRecordingsTable)
        .set({ pending_approval: false })
        .where(
            and(
                eq(audioRecordingsTable.companionId, companionId),
                eq(audioRecordingsTable.pending_approval, true),
            ),
        );

    return { success: true };
}

/**
 * Deita fora o áudio de uma edição recusada. O aprovado, se houver, fica
 * exactamente como estava. Só admin.
 */
export async function discardPendingAudio(
    companionId: number,
): Promise<{ success: boolean; error?: string; }> {
    const { userId } = await auth();
    if (!userId || !isAdmin(userId)) {
        return { success: false, error: "Não autorizado" };
    }

    const pending = await db
        .select({ id: audioRecordingsTable.id, storagePath: audioRecordingsTable.storage_path })
        .from(audioRecordingsTable)
        .where(
            and(
                eq(audioRecordingsTable.companionId, companionId),
                eq(audioRecordingsTable.pending_approval, true),
            ),
        );

    await removeAudios(pending);
    return { success: true };
}

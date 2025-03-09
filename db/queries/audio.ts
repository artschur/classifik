"use server";

import { db } from "..";
import { audioRecordingsTable } from "../schema";
import { createClient } from "@supabase/supabase-js";
import { and, eq } from "drizzle-orm";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadAudio({ audioFile, companionId, clerkId }: {
    audioFile: File;
    companionId: number;
    clerkId: string;
}) {

    try {
        const fileName = `audio/${clerkId}/${Date.now()}-${audioFile.name}`;

        const upload = await supabase.storage.from("images").upload(fileName, audioFile, {
            cacheControl: "3600",
            upsert: true,
        });

        if (upload.error) {
            throw upload.error;
        }

        const { data: { publicUrl } } = await supabase.storage.from("images").getPublicUrl(fileName);


        const newAudio = await db
            .insert(audioRecordingsTable)
            .values({
                authId: clerkId,
                companionId: companionId,
                storage_path: fileName,
                public_url: publicUrl,
            })
            .returning();

        return { success: true, audio: newAudio[0] };

    } catch (error) {
        console.error("Error uploading audio:", error);
        return {
            error: error instanceof Error ? error.message : "Failed to upload audio",
        };
    }
}

export async function getAudioUrlByCompanionId(companionId: number): Promise<{ id: number; publicUrl: string; } | null> {
    try {
        const [audioResults] = await db
            .select({
                id: audioRecordingsTable.id,
                publicUrl: audioRecordingsTable.public_url,
            })
            .from(audioRecordingsTable)
            .where(eq(audioRecordingsTable.companionId, companionId))
            .limit(1);

        if (!audioResults) {
            return null;
        }

        return audioResults;
    } catch (error) {
        console.error("Error fetching audio:", error);
        return null;
    }
}

export async function getAudioUrlByClerkId(clerkId: string): Promise<{ id: number; publicUrl: string; } | null> {
    try {
        const [audioResults] = await db
            .select({
                id: audioRecordingsTable.id,
                publicUrl: audioRecordingsTable.public_url,
            })
            .from(audioRecordingsTable)
            .where(eq(audioRecordingsTable.authId, clerkId))
            .limit(1);

        if (!audioResults) {
            return null;
        }

        return audioResults;
    } catch (error) {
        console.error("Error fetching audio:", error);
        return null;
    }
}

export async function updateAudio(
    { audioFile, companionId, clerkId }: {
        audioFile: File,
        companionId?: number,
        clerkId?: string,
    }
): Promise<{ success?: boolean; error?: string; }> {

    if (!companionId && !clerkId) {
        return { error: "Either companionId or clerkId is required" };
    }

    const conditions = [
        companionId ? eq(audioRecordingsTable.companionId, companionId) : undefined,
        clerkId ? eq(audioRecordingsTable.authId, clerkId) : undefined,
    ].filter(Boolean);

    const existingAudios = await db.select({
        storagePath: audioRecordingsTable.storage_path,
    })
        .from(audioRecordingsTable)
        .where(and(...conditions));

    const deleteStoragePromise = existingAudios.length > 0
        ? supabase.storage.from("images").remove(existingAudios.map(audio => audio.storagePath))
        : Promise.resolve({ error: null });

    const deleteTablePromise = db.delete(audioRecordingsTable).where(and(...conditions));

    const uploadPromise = uploadAudio({
        audioFile,
        companionId: companionId!,
        clerkId: clerkId!,
    });

    const [deleteStorageResult, deleteTableResult, uploadResult] = await Promise.all([
        deleteStoragePromise,
        deleteTablePromise,
        uploadPromise
    ]);

    if (deleteStorageResult.error) {
        console.error("Error deleting old audio files:", deleteStorageResult.error);
        return { error: deleteStorageResult.error.message };
    }

    if (uploadResult.error) {
        console.error("Error uploading new audio:", uploadResult.error);
        return { error: uploadResult.error };
    }

    return uploadResult;
}


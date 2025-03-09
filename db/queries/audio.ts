"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "..";
import { audioRecordingsTable } from "../schema";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

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

export async function getAudioUrlByCompanionId(companionId: number): Promise<{ id: number; publicUrl: string; }> {
    try {
        console.log("fetched audio");
        const [audio] = await db
            .select({
                id: audioRecordingsTable.id,
                publicUrl: audioRecordingsTable.public_url,
            })
            .from(audioRecordingsTable)
            .where(eq(audioRecordingsTable.companionId, companionId))
            .limit(1);

        return audio;
    } catch (error) {
        console.error("Error fetching audio:", error);
        throw Error("Failed to fetch audio");
    }
}
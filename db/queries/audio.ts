"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "..";
import { audioRecordingsTable } from "../schema";
import { createClient } from "@supabase/supabase-js";

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
        console.log("Uploading audio file:", audioFile);
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


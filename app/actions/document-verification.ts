"use server";

import { db } from "@/db";
import {
  documentsTable,
  companionsTable,
  imagesTable,
  audioRecordingsTable,
} from "@/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getCompanionIdByClerkId } from "@/db/queries/companions";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { getClerkIdByCompanionId } from "@/db/queries/userActions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function uploadDocument(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Authentication required");
    }

    const companionId = await getCompanionIdByClerkId(userId);
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file || !documentType) {
      throw new Error("Missing required fields");
    }

    const fileExtension = file.name.split(".").pop();
    const fileName = `${userId}_${documentType}_${Date.now()}.${fileExtension}`;

    // All documents including verification videos go to documents bucket
    const storagePath = `documents/${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(storagePath);

    // Save document information to database
    await db.insert(documentsTable).values({
      authId: userId,
      companionId,
      document_type: documentType,
      storage_path: storagePath,
      public_url: publicUrl,
    });

    const status = await verifyItemsIfOnboardingComplete(userId);

    // Check for both the video and at least one ID document
    if (status.isVerificationVideoUploaded && status.isDocumentUploaded) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const existingPublicMetadata = user.publicMetadata || {};

      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...existingPublicMetadata,
          hasUploadedDocs: true,
        },
      });
    }

    revalidatePath("/verify");
    revalidatePath("/companions/verification");

    return { success: true, publicUrl };
  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getDocumentsByCompanionId(companionId: number) {
  try {
    const documents = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.companionId, companionId))
      .orderBy(documentsTable.created_at);

    return { success: true, documents };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      documents: [],
    };
  }
}

export async function getDocumentsByAuthId(authId: string) {
  try {
    const documents = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.authId, authId))
      .orderBy(documentsTable.created_at);

    return { success: true, documents };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      documents: [],
    };
  }
}

export async function verifyDocument(
  documentId: number,
  verified: boolean,
  documentType: string,
  notes?: string,
) {
  try {
    await db
      .update(documentsTable)
      .set({
        verified,
        verification_date: verified ? new Date() : null,
        notes,
        updated_at: new Date(),
      })
      .where(eq(documentsTable.id, documentId));

    revalidatePath("/verify");
    revalidatePath("/companions/verification");

    return { success: true };
  } catch (error) {
    console.error("Error verifying document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteDocument(documentId: number) {
  try {
    const [documentToDelete] = await db
      .select({
        storage_path: documentsTable.storage_path,
        document_type: documentsTable.document_type,
        companionId: documentsTable.companionId,
      })
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId));

    if (!documentToDelete) {
      throw new Error("Document not found");
    }

    const bucket = "documents"; // All documents now in documents bucket

    const { error: deleteStorageError } = await supabase.storage
      .from(bucket)
      .remove([documentToDelete.storage_path]);

    if (deleteStorageError) {
      console.error("Error deleting from storage:", deleteStorageError);
    }

    await db.delete(documentsTable).where(eq(documentsTable.id, documentId));

    // No longer deleting from imagesTable for verification videos

    revalidatePath("/verify");
    revalidatePath("/companions/verification");
    revalidatePath(`/${documentToDelete.companionId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

interface StatusOfItems {
  isImageUploaded: boolean;
  isAudioUploaded: boolean;
  isVerificationVideoUploaded: boolean;
  isDocumentUploaded: boolean;
}
export async function verifyItemsIfOnboardingComplete(
  clerkId: string,
): Promise<StatusOfItems> {
  try {
    const [imageResult, audioResult, verificationVideoResult, documentResult] =
      await Promise.all([
        db.select().from(imagesTable).where(eq(imagesTable.authId, clerkId)),
        db
          .select()
          .from(audioRecordingsTable)
          .where(and(eq(audioRecordingsTable.authId, clerkId))),
        db
          .select()
          .from(documentsTable)
          .where(
            and(
              eq(documentsTable.authId, clerkId),
              eq(documentsTable.document_type, "verification_video"),
            ),
          ),
        db
          .select()
          .from(documentsTable)
          .where(
            and(
              eq(documentsTable.authId, clerkId),
              inArray(documentsTable.document_type, [
                "id_card",
                "passport",
                "drivers_license",
                "selfie",
              ]),
            ),
          ),
      ]);

    const isImageUploaded = imageResult.length > 0;
    const isAudioUploaded = audioResult.length > 0;
    const isVerificationVideoUploaded = verificationVideoResult.length > 0;
    const isDocumentUploaded = documentResult.length > 0;

    return {
      isImageUploaded,
      isAudioUploaded,
      isVerificationVideoUploaded,
      isDocumentUploaded,
    };
  } catch (error) {
    console.error("Error checking items status:", error);
    return {
      isImageUploaded: false,
      isAudioUploaded: false,
      isVerificationVideoUploaded: false,
      isDocumentUploaded: false,
    };
  }
}

export async function isVerificationPending(clerkId: string): Promise<boolean> {
  try {
    const [companionResult, documentsData] = await Promise.all([
      db
        .select({ verified: companionsTable.verified })
        .from(companionsTable)
        .where(eq(companionsTable.auth_id, clerkId)),

      db
        .select({
          document_type: documentsTable.document_type,
        })
        .from(documentsTable)
        .where(eq(documentsTable.authId, clerkId)),
    ]);

    if (companionResult.length === 0) {
      return false;
    }

    const companion = companionResult[0];

    if (companion.verified) {
      return false;
    }

    const documentTypes = documentsData.map((doc) => doc.document_type);
    const hasVerificationVideo = documentTypes.includes("verification_video");

    const hasIdDocument = documentTypes.some((type) =>
      ["id_card", "passport", "drivers_license", "selfie"].includes(type),
    );

    return hasVerificationVideo && hasIdDocument;
  } catch (error) {
    console.error("Error checking verification pending status:", error);
    return false;
  }
}

export async function deleteAllDocumentsFromCompanion(companionId: number) {
  try {
    const authId = await getClerkIdByCompanionId(companionId);

    const [verificationVideoPath] = await db
      .select({ storage_path: documentsTable.storage_path })
      .from(documentsTable)
      .where(
        and(
          eq(documentsTable.companionId, companionId),
          eq(documentsTable.document_type, "verification_video"),
        ),
      );

    await Promise.all([
      supabase.storage.from("images").remove([`${authId}/`]),
      supabase.storage.from("documents").remove([`documents/${authId}/`]),
    ]);

    revalidatePath("/verify");
    revalidatePath("/companions/verification");

    return { success: true };
  } catch (error) {
    console.error("Error deleting all documents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Generates a signed upload URL for direct client-to-Supabase uploads.
 * This bypasses serverless function payload limits (e.g. Vercel's 4.5MB limit).
 */
export async function getSignedUploadUrl(
  documentType: string,
  fileExtension: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false as const, error: "Authentication required" };
    }

    const fileName = `${userId}_${documentType}_${Date.now()}.${fileExtension}`;
    const storagePath = `documents/${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUploadUrl(storagePath);

    if (error) {
      throw new Error(`Error creating signed URL: ${error.message}`);
    }

    return {
      success: true as const,
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token,
      storagePath,
    };
  } catch (error) {
    console.error("Error generating signed upload URL:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Saves document metadata to the database after a successful client-side upload.
 * Called after the client uploads the file directly to Supabase using the signed URL.
 */
export async function saveDocumentAfterUpload(
  documentType: string,
  storagePath: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Authentication required");
    }

    const companionId = await getCompanionIdByClerkId(userId);

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(storagePath);

    // Save document information to database
    await db.insert(documentsTable).values({
      authId: userId,
      companionId,
      document_type: documentType,
      storage_path: storagePath,
      public_url: publicUrl,
    });

    const status = await verifyItemsIfOnboardingComplete(userId);

    // Check for both the video and at least one ID document
    if (status.isVerificationVideoUploaded && status.isDocumentUploaded) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const existingPublicMetadata = user.publicMetadata || {};

      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...existingPublicMetadata,
          hasUploadedDocs: true,
        },
      });
    }

    revalidatePath("/verify");
    revalidatePath("/companions/verification");

    return { success: true as const, publicUrl };
  } catch (error) {
    console.error("Error saving document record:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

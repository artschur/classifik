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
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { getClerkIdByCompanionId } from "@/db/queries/userActions";
import { tagCompanionInRD } from "@/lib/rd-station";
import { isAdmin } from "@/components/header";
import {
  getSupabaseAdmin,
  removeStorageFolder,
  signDocumentUrl,
} from "@/lib/supabase-admin";

/**
 * Tipos aceites no envio. Fazem parte do nome do ficheiro, por isso não podem
 * ser texto livre vindo do navegador.
 */
const DOCUMENT_TYPES = [
  "id_card",
  "passport",
  "drivers_license",
  "selfie",
  "verification_video",
];

/**
 * Chegar aqui significa que o documento e o vídeo estão ambos enviados, que é
 * o fim do registo. A tag no RD é o que tira a pessoa da lista de quem parou
 * a meio, já que as tags do RD não se podem remover.
 *
 * Não é exportada: neste ficheiro tudo o que se exporta vira uma acção
 * chamável do browser, e isto é um detalhe interno.
 */
async function markRegistrationComplete(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...(user.publicMetadata || {}),
      hasUploadedDocs: true,
    },
  });

  const email = user.emailAddresses[0]?.emailAddress;
  if (email) {
    await tagCompanionInRD(email, "registo-concluido", user.fullName ?? undefined);
  }
}

/**
 * Documentos de uma acompanhante, para o ecrã de verificação. Só para admin.
 *
 * O bucket é privado, por isso cada documento vem com um endereço assinado e
 * temporário (`url`) em vez do endereço público, que deixou de abrir.
 */
export async function getDocumentsByCompanionId(companionId: number) {
  try {
    const { userId } = await auth();
    if (!userId || !isAdmin(userId)) {
      return { success: false, error: "Não autorizado", documents: [] };
    }

    const rows = await db
      .select({
        id: documentsTable.id,
        document_type: documentsTable.document_type,
        storage_path: documentsTable.storage_path,
        public_url: documentsTable.public_url,
        verified: documentsTable.verified,
        verification_date: documentsTable.verification_date,
        notes: documentsTable.notes,
        created_at: documentsTable.created_at,
      })
      .from(documentsTable)
      .where(eq(documentsTable.companionId, companionId))
      .orderBy(documentsTable.created_at);

    const documents = await Promise.all(
      rows.map(async ({ public_url, ...doc }) => ({
        ...doc,
        url: await signDocumentUrl({ storage_path: doc.storage_path, public_url }),
      })),
    );

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

/**
 * O que a própria anunciante já enviou. Identifica-a pela sessão, nunca por
 * um id vindo do navegador, e não devolve endereços: o formulário só precisa
 * de saber que tipos de documento já lá estão.
 */
export async function getMyDocuments() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required", documents: [] };
    }

    const documents = await db
      .select({
        id: documentsTable.id,
        document_type: documentsTable.document_type,
        verified: documentsTable.verified,
        created_at: documentsTable.created_at,
      })
      .from(documentsTable)
      .where(eq(documentsTable.authId, userId))
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
    const { userId } = await auth();
    if (!userId || !isAdmin(userId)) {
      return { success: false, error: "Não autorizado" };
    }

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
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Authentication required");
    }

    const [documentToDelete] = await db
      .select({
        storage_path: documentsTable.storage_path,
        document_type: documentsTable.document_type,
        companionId: documentsTable.companionId,
        authId: documentsTable.authId,
      })
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId));

    if (!documentToDelete) {
      throw new Error("Document not found");
    }

    // Só a dona do documento ou um admin o podem apagar.
    if (documentToDelete.authId !== userId && !isAdmin(userId)) {
      throw new Error("Não autorizado");
    }

    const bucket = "documents"; // All documents now in documents bucket

    const { error: deleteStorageError } = await getSupabaseAdmin()
      .storage.from(bucket)
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

/**
 * Apaga do Storage as fotos e os documentos de um registo recusado. Só admin.
 *
 * Antes passava as pastas directamente a `remove`, que só apaga caminhos
 * exactos: não apagava nada nem dava erro, e os documentos de identidade de
 * quem foi recusada ficavam guardados sem ninguém saber.
 */
export async function deleteAllDocumentsFromCompanion(companionId: number) {
  try {
    const { userId } = await auth();
    if (!userId || !isAdmin(userId)) {
      return { success: false, error: "Não autorizado" };
    }

    const authId = await getClerkIdByCompanionId(companionId);

    await Promise.all([
      removeStorageFolder("images", `${authId}/`),
      removeStorageFolder("images", `audio/${authId}/`),
      removeStorageFolder("documents", `documents/${authId}/`),
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

    if (!DOCUMENT_TYPES.includes(documentType)) {
      return { success: false as const, error: "Tipo de documento inválido" };
    }
    const extension = fileExtension.toLowerCase();
    if (!/^[a-z0-9]{1,8}$/.test(extension)) {
      return { success: false as const, error: "Extensão de ficheiro inválida" };
    }

    const fileName = `${userId}_${documentType}_${Date.now()}.${extension}`;
    const storagePath = `documents/${userId}/${fileName}`;

    const { data, error } = await getSupabaseAdmin()
      .storage.from("documents")
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

    if (!DOCUMENT_TYPES.includes(documentType)) {
      throw new Error("Tipo de documento inválido");
    }

    // O caminho vem do navegador. Sem esta verificação dava para registar na
    // própria conta o caminho do documento de outra pessoa, e passar a vê-lo
    // como se fosse seu.
    const ownFolder = `documents/${userId}/`;
    const fileName = storagePath.slice(ownFolder.length);
    if (
      !storagePath.startsWith(ownFolder) ||
      !fileName ||
      fileName.includes("/") ||
      fileName.includes("..")
    ) {
      throw new Error("Caminho de documento inválido");
    }

    const companionId = await getCompanionIdByClerkId(userId);

    // O endereço público já não abre (o bucket é privado) e não é usado para
    // mostrar nada; fica gravado por a coluna ser obrigatória e por ser o que
    // indica em que bucket está o ficheiro.
    const {
      data: { publicUrl },
    } = getSupabaseAdmin().storage.from("documents").getPublicUrl(storagePath);

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
      await markRegistrationComplete(userId);
    }

    revalidatePath("/verify");
    revalidatePath("/companions/verification");

    return { success: true as const };
  } catch (error) {
    console.error("Error saving document record:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

'use server';

import { db } from '@/db';
import { documentsTable, companionsTable, imagesTable, audioRecordingsTable } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { getCompanionIdByClerkId } from '@/db/queries/companions';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { getClerkIdByCompanionId } from '@/db/queries/userActions';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadDocument(formData: FormData) {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error('Authentication required');
        }

        const companionId = await getCompanionIdByClerkId(userId);
        const file = formData.get('file') as File;
        const documentType = formData.get('documentType') as string;

        if (!file || !documentType) {
            throw new Error('Missing required fields');
        }

        // Special size limit for verification videos (100MB)
        const maxSize = documentType === 'verification_video' ? 100000000 : 5000000; // 100MB or 5MB limit

        if (file.size > maxSize) {
            throw new Error(`File too large. Maximum size is ${maxSize === 5000000 ? '5MB' : '100MB'}`);
        }

        const fileExtension = file.name.split('.').pop();
        const fileName = `${userId}_${documentType}_${Date.now()}.${fileExtension}`;

        // For verification videos, store them in the images bucket but mark them
        if (documentType === 'verification_video') {
            const storagePath = `verification_videos/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('images')
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(`Error uploading file: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase
                .storage
                .from('images')
                .getPublicUrl(storagePath);

            Promise.all([
                await db.insert(documentsTable).values({
                    authId: userId,
                    companionId,
                    document_type: documentType,
                    storage_path: storagePath,
                    public_url: publicUrl,
                }),
                await db.insert(imagesTable).values({
                    authId: userId,
                    companionId: companionId,
                    storage_path: storagePath,
                    public_url: publicUrl,
                    is_verification_video: true,
                })
            ]);

            revalidatePath('/verify');
            revalidatePath('/companions/verification');
            revalidatePath(`/${companionId}`);

            return { success: true, publicUrl };
        } else {
            const storagePath = `documents/${userId}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('documents')
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(`Error uploading file: ${uploadError.message}`);
            }

            // Get the public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('documents')
                .getPublicUrl(storagePath);

            // Save document information to database
            await db.insert(documentsTable).values({
                authId: userId,
                companionId,
                document_type: documentType,
                storage_path: storagePath,
                public_url: publicUrl,
            });

            // Revalidate the verification page
            revalidatePath('/verify');
            revalidatePath('/companions/verification');

            return { success: true, publicUrl };
        }
    } catch (error) {
        console.error('Error uploading document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getDocumentsByCompanionId(companionId: number) {
    try {
        const documents = await db.select().from(documentsTable)
            .where(eq(documentsTable.companionId, companionId))
            .orderBy(documentsTable.created_at);

        return { success: true, documents };
    } catch (error) {
        console.error('Error fetching documents:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            documents: []
        };
    }
}

export async function getDocumentsByAuthId(authId: string) {
    try {
        const documents = await db.select().from(documentsTable)
            .where(eq(documentsTable.authId, authId))
            .orderBy(documentsTable.created_at);

        return { success: true, documents };
    } catch (error) {
        console.error('Error fetching documents:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            documents: []
        };
    }
}

export async function verifyDocument(documentId: number, verified: boolean, documentType: string, notes?: string) {
    try {

        await db.update(documentsTable)
            .set({
                verified,
                verification_date: verified ? new Date() : null,
                notes,
                updated_at: new Date()
            })
            .where(eq(documentsTable.id, documentId));

        revalidatePath('/verify');
        revalidatePath('/companions/verification');

        return { success: true };
    } catch (error) {
        console.error('Error verifying document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function deleteDocument(documentId: number) {
    try {

        const [documentToDelete] = await db.select({
            storage_path: documentsTable.storage_path,
            document_type: documentsTable.document_type,
            companionId: documentsTable.companionId
        })
            .from(documentsTable)
            .where(eq(documentsTable.id, documentId));

        if (!documentToDelete) {
            throw new Error('Document not found');
        }

        const bucket = documentToDelete.document_type === 'verification_video' ? 'images' : 'documents';

        const { error: deleteStorageError } = await supabase
            .storage
            .from(bucket)
            .remove([documentToDelete.storage_path]);

        if (deleteStorageError) {
            console.error('Error deleting from storage:', deleteStorageError);
        }

        await db.delete(documentsTable).where(eq(documentsTable.id, documentId));

        if (documentToDelete.document_type === 'verification_video') {
            await db.delete(imagesTable).where(eq(imagesTable.storage_path, documentToDelete.storage_path));
        }

        revalidatePath('/verify');
        revalidatePath('/companions/verification');
        revalidatePath(`/${documentToDelete.companionId}`);

        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

interface StatusOfItems {
    isImageUploaded: boolean;
    isAudioUploaded: boolean;
    isVerificationVideoUploaded: boolean;
    isDocumentUploaded: boolean;
}
export async function verifyItemsIfOnboardingComplete(clerkId: string): Promise<StatusOfItems> {
    try {
        const [imageResult, audioResult, verificationVideoResult, documentResult] = await Promise.all([
            db.select().from(imagesTable).where(eq(imagesTable.authId, clerkId)), //
            db.select().from(audioRecordingsTable).where(and(eq(documentsTable.authId, clerkId), eq(documentsTable.document_type, 'audio'))),
            db.select().from(imagesTable).where(and(eq(documentsTable.authId, clerkId), eq(imagesTable.is_verification_video, true))),
            db.select().from(documentsTable).where(and(eq(documentsTable.authId, clerkId), eq(documentsTable.document_type, 'document'))),
        ]);

        const isImageUploaded = imageResult.length > 0;
        const isAudioUploaded = audioResult.length > 0;
        const isVerificationVideoUploaded = verificationVideoResult.length > 0;
        const isDocumentUploaded = documentResult.length > 0;

        return {
            isImageUploaded,
            isAudioUploaded,
            isVerificationVideoUploaded,
            isDocumentUploaded
        };
    } catch (error) {
        console.error('Error checking items status:', error);
        return {
            isImageUploaded: false,
            isAudioUploaded: false,
            isVerificationVideoUploaded: false,
            isDocumentUploaded: false
        };
    }
}

export async function isVerificationPending(clerkId: string): Promise<boolean> {
    try {
        const [companionResult, documentsData] = await Promise.all([
            db.select({ verified: companionsTable.verified })
                .from(companionsTable)
                .where(eq(companionsTable.auth_id, clerkId)),

            db.select({
                document_type: documentsTable.document_type
            })
                .from(documentsTable)
                .where(eq(documentsTable.authId, clerkId))
        ]);

        if (companionResult.length === 0) {
            return false;
        }

        const companion = companionResult[0];

        if (companion.verified) {
            return false;
        }

        const documentTypes = documentsData.map(doc => doc.document_type);
        const hasVerificationVideo = documentTypes.includes('verification_video');

        const hasIdDocument = documentTypes.some(type =>
            ['id_card', 'passport', 'drivers_license', 'selfie'].includes(type)
        );

        return hasVerificationVideo && hasIdDocument;
    } catch (error) {
        console.error('Error checking verification pending status:', error);
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
                    eq(documentsTable.document_type, 'verification_video')
                )
            );

        Promise.all([
            await supabase.storage.from('images').remove([`${authId}/`]),
            await supabase.storage.from('documents').remove([`documents/${authId}/`]),
            await supabase.storage.from('images').remove([verificationVideoPath.storage_path]),
        ]);



        revalidatePath('/verify');
        revalidatePath('/companions/verification');

        return { success: true };
    } catch (error) {
        console.error('Error deleting all documents:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
'use server';

import { db } from '@/db';
import { documentsTable, companionsTable } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { getCompanionIdByClerkId } from '@/db/queries/companions';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';

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
        const storagePath = `documents/${fileName}`;

        // Upload file to Supabase storage
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

export async function verifyDocument(documentId: number, verified: boolean, notes?: string) {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error('Authentication required');
        }

        const [document] = await db.select({
            companionId: documentsTable.companionId,
            document_type: documentsTable.document_type,
            storage_path: documentsTable.storage_path
        })
            .from(documentsTable)
            .where(eq(documentsTable.id, documentId));

        if (!document) {
            throw new Error('Document not found');
        }

        await db.update(documentsTable)
            .set({
                verified,
                verification_date: verified ? new Date() : null,
                notes,
                updated_at: new Date()
            })
            .where(eq(documentsTable.id, documentId));

        // If this is a verification video and it's verified, delete it for GDPR compliance
        if (document.document_type === 'verification_video' && verified) {

            const { error: deleteStorageError } = await supabase
                .storage
                .from('documents')
                .remove([document.storage_path]);

            if (deleteStorageError) {
                console.error('Error deleting verification video from storage:', deleteStorageError);
            }

            await db.delete(documentsTable)
                .where(eq(documentsTable.id, documentId));

            console.log(`Verification video deleted for GDPR compliance: ${documentId}`);
        }

        if (verified) {
            const verifiedDocs = await db.select({
                document_type: documentsTable.document_type,
            })
                .from(documentsTable)
                .where(and(
                    eq(documentsTable.companionId, document.companionId),
                    eq(documentsTable.verified, true)
                ));

            // If verification video plus at least one ID document is verified
            const hasVerifiedId = verifiedDocs.some(doc =>
                ['id_card', 'passport', 'drivers_license'].includes(doc.document_type)
            );

            const hasVerifiedSelfie = verifiedDocs.some(doc => doc.document_type === 'selfie');

            // If they have either a verified ID or at least two verified documents
            if (hasVerifiedId || verifiedDocs.length >= 2) {
                await db.update(companionsTable)
                    .set({ verified: true })
                    .where(eq(companionsTable.id, document.companionId));
            }
        }

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
        const { userId } = await auth();
        if (!userId) {
            throw new Error('Authentication required');
        }

        // Get the document to delete
        const [documentToDelete] = await db.select({
            storage_path: documentsTable.storage_path,
            document_type: documentsTable.document_type,
        })
            .from(documentsTable)
            .where(eq(documentsTable.id, documentId));

        if (!documentToDelete) {
            throw new Error('Document not found');
        }

        const { error: deleteStorageError } = await supabase
            .storage
            .from('documents')
            .remove([documentToDelete.storage_path]);

        if (deleteStorageError) {
            console.error('Error deleting from storage:', deleteStorageError);
        }

        await db.delete(documentsTable).where(eq(documentsTable.id, documentId));

        revalidatePath('/verify');
        revalidatePath('/companions/verification');

        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
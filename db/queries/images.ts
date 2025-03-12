'use server';

import { File } from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';
import { db } from '..';
import { imagesTable } from '../schema';
import { auth } from '@clerk/nextjs/server';
import { and, eq, SQL, sql } from 'drizzle-orm';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Compression options
const compressionOptions = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, compressionOptions);
  } catch (error) {
    console.error('Compression failed:', error);
    return file;
  }
}

function sanitizeFilename(filename: string): string {
  // Remove accented characters and replace spaces with underscores
  const sanitized = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove any other invalid characters

  return sanitized;
}

export async function uploadImage(
  file: File,
  companionId: number,
  bucket: string = 'images'
): Promise<{
  fileUrl: string;
  error: Error | null;
}> {
  try {
    const clerkId = (await auth()).userId;
    if (!clerkId) throw new Error('User not authenticated');
    if (!companionId) throw new Error('Companion ID is required');

    const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;

    if (!fileType) {
      throw new Error('Unsupported file type. Only images and videos are allowed.');
    }

    let compressedFile: File = file;

    if (fileType === 'image') {
      compressedFile = await compressImage(file);
    }

    const ext = compressedFile.name.split('.').pop() || '';
    let baseName = compressedFile.name.split('.')[0];

    const sanitizedBaseName = sanitizeFilename(baseName);

    compressedFile = new File(
      [compressedFile],
      `${sanitizedBaseName}-${Math.floor(Math.random() * 10000)}.${ext}`,
      { type: compressedFile.type }
    );

    const path = `${clerkId}/${compressedFile.name}`;

    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(path, compressedFile);

    if (storageError) throw storageError;
    const { data } = await supabase.storage.from(bucket).getPublicUrl(path);

    await db.insert(imagesTable).values({
      companionId: companionId,
      authId: clerkId,
      storage_path: path,
      public_url: data.publicUrl,
    });

    return { fileUrl: data.publicUrl, error: null };
  } catch (error) {
    console.error('Upload failed:', error);
    return { fileUrl: '', error: error instanceof Error ? error : new Error('Upload failed') };
  }
}

export async function getImagesByAuthId(
  authId: string
): Promise<{ publicUrl: string; storagePath: string; }[]> {
  const images = await db
    .select({ publicUrl: imagesTable.public_url, storagePath: imagesTable.storage_path })
    .from(imagesTable)
    .where(eq(imagesTable.authId, authId));

  return images;
}

export async function deleteImage(
  storagePath: string,
  bucket: string = 'images'
): Promise<void> {

  const removeFromBucket = supabase.storage.from(bucket).remove([storagePath]);
  const removeFromDb = db.delete(imagesTable).where(eq(imagesTable.storage_path, storagePath));

  await Promise.all([removeFromBucket, removeFromDb]);

}

export async function getImagesByCompanionId(
  companionId: number,
  limit: number = 3,
  offset: number = 0
): Promise<{ images: { publicUrl: string; isVerificationVideo: boolean; }[]; total: number; }> {

  const conditions: SQL[] = [
    eq(imagesTable.companionId, companionId),
    eq(imagesTable.is_verification_video, false)];

  const [images, [{ count }]] = await Promise.all([
    db
      .select({ publicUrl: imagesTable.public_url, isVerificationVideo: imagesTable.is_verification_video })
      .from(imagesTable)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(imagesTable)
      .where(and(...conditions))
  ]);

  return {
    images,
    total: count
  };
}

export async function getVerificationVideosByCompanionId(
  companionId: number
): Promise<{ publicUrl: string; createdAt: Date; }[]> {

  const videos = await db
    .select({ publicUrl: imagesTable.public_url, createdAt: imagesTable.created_at })
    .from(imagesTable)
    .where(
      and(
        eq(imagesTable.companionId, companionId),
        eq(imagesTable.is_verification_video, true)
      )
    );

  return videos;
}
'use server';

import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';
import { db } from '..';
import { companionsTable, imagesTable } from '../schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { getCompanionIdByClerkId } from './companions';

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

// Function to compress image
async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, compressionOptions);
  } catch (error) {
    console.error('Compression failed:', error);
    return file;
  }
}

export async function uploadImage(
  file: File,
  bucket: string = 'images'
): Promise<{
  fileUrl: string;
  error: Error | null;
}> {
  try {
    let compressedFile = await compressImage(file);

    const ext = compressedFile.name.split('.').pop() || '';

    compressedFile = new File(
      [compressedFile],
      `${compressedFile.name.split('.')[0]}-${Math.floor(
        Math.random() * 10000
      )}.${ext}`,
      { type: compressedFile.type }
    );
    const clerkId = (await auth()).userId;
    if (!clerkId) throw new Error('User not authenticated');

    const path = `${clerkId}/${compressedFile.name}`;

    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(path, compressedFile);

    if (storageError) throw storageError;

    const { data } = await supabase.storage.from(bucket).getPublicUrl(path);
    
    const companionId = await getCompanionIdByClerkId(clerkId);

    await db.insert(imagesTable).values({
      companionId: companionId,
      authId: clerkId,
      storage_path: path,
      public_url: data.publicUrl,
    });

    return { fileUrl: data.publicUrl, error: null };
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

export async function getImagesByAuthId(
  authId: string
): Promise<{ publicUrl: string }[]> {
  const images = await db
    .select({ publicUrl: imagesTable.public_url })
    .from(imagesTable)
    .where(eq(imagesTable.authId, authId));

  return images;
}

export async function deleteImage(
  publicUrl: string,
  bucket: string = 'images'
): Promise<void> {
  const path = publicUrl.split('/').pop() || '';
  await supabase.storage.from(bucket).remove([path]);

  const { error: storageRemoveError } = await supabase.storage
    .from(bucket)
    .remove([path]);
  if (storageRemoveError) {
    console.error('Storage removal failed:', storageRemoveError);
    throw new Error('Image removal from storage failed');
  }

  await db.delete(imagesTable).where(eq(imagesTable.public_url, publicUrl));
}

export async function getImagesByCompanionId(
  companionId: number
): Promise<{ publicUrl: string }[]> {

  const images = await db
    .select({ publicUrl: imagesTable.public_url })
    .from(imagesTable)
    .where(eq(imagesTable.id, companionId));

  return images;
}

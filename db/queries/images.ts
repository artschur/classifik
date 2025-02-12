'use server';

import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';
import { db } from '..';
import { imagesTable } from '../schema';
import { auth } from '@clerk/nextjs/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ImageMetadata {
  ownerId: string;
  originalName: string;
  size: number;
  type: string;
  createdAt: string;
}

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
    const companionId = (await auth()).userId;
    if (!companionId) throw new Error('User not authenticated');

    const path = `${companionId}/${compressedFile.name}`;

    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(path, compressedFile);

    if (storageError) throw storageError;

    const { data } = await supabase.storage.from(bucket).getPublicUrl(path);

    await db.insert(imagesTable).values({
      companion_id: companionId,
      storage_path: path,
      public_url: data.publicUrl,
    });

    return { fileUrl: data.publicUrl, error: null };
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

export async function getMockImage() {
  const { data } = await supabase.storage
    .from('images')
    .getPublicUrl('mock.png');
  return data;
}

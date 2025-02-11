import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

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

// Function to upload image with owner linking
export async function uploadImage(
  file: File,
  ownerId: string,
  bucket: string = 'images'
): Promise<{
  path: string | null;
  error: Error | null;
  metadata: ImageMetadata | null;
}> {
  try {
    // Compress image
    const compressedFile = await compressImage(file);

    // Create unique filename with owner prefix
    const fileExt = file.name.split('.').pop();
    const fileName = `${ownerId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    // Create metadata
    const metadata: ImageMetadata = {
      ownerId,
      originalName: file.name,
      size: compressedFile.size,
      type: compressedFile.type,
      createdAt: new Date().toISOString(),
    };

    // Upload file to Supabase with metadata
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, compressedFile, {
        metadata: metadata as any,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    // Store image reference in a separate table
    const { error: dbError } = await supabase.from('images').insert({
      owner_id: ownerId,
      storage_path: fileName,
      public_url: publicUrl,
      metadata,
    });

    if (dbError) {
      throw dbError;
    }

    return { path: publicUrl, metadata, error: null };
  } catch (error) {
    return { path: null, metadata: null, error: error as Error };
  }
}

// Function to get all images for an owner
export async function getOwnerImages(ownerId: string): Promise<{
  images: Array<{ path: string; metadata: ImageMetadata }> | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      images: data.map((img) => ({
        path: img.public_url,
        metadata: img.metadata,
      })),
      error: null,
    };
  } catch (error) {
    return { images: null, error: error as Error };
  }
}

// Function to delete image with owner check
export async function deleteImage(
  path: string,
  ownerId: string,
  bucket: string = 'images'
): Promise<{ error: Error | null }> {
  try {
    // Delete from database first
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .match({ storage_path: path, owner_id: ownerId });

    if (dbError) throw dbError;

    // Then delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (storageError) throw storageError;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function getMockImage() {
  const { data } = await supabase.storage
    .from('images')
    .getPublicUrl('mock.png');
  return data;
}

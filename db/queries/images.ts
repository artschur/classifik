'use server';

import { createClient } from '@supabase/supabase-js';
import { db } from '..';
import { imagesTable } from '../schema';
import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, inArray, SQL, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

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

    // Fotos novas entram no fim da ordem existente. Se dois envios em paralelo
    // apanharem a mesma posição não faz mal: o desempate por id mantém a ordem
    // estável, e a anunciante pode reordenar à mão a seguir.
    const [{ nextPosition }] = await db
      .select({
        nextPosition: sql<number>`COALESCE(MAX(${imagesTable.position}), -1) + 1`,
      })
      .from(imagesTable)
      .where(eq(imagesTable.companionId, companionId));

    await db.insert(imagesTable).values({
      companionId: companionId,
      authId: clerkId,
      storage_path: path,
      public_url: data.publicUrl,
      position: Number(nextPosition) || 0,
    });

    revalidateCompanionMedia();

    return { fileUrl: data.publicUrl, error: null };
  } catch (error) {
    console.error('Upload failed:', error);
    return { fileUrl: '', error: error instanceof Error ? error : new Error('Upload failed') };
  }
}

// Não é exportada de propósito: este ficheiro é 'use server', e tudo o que for
// exportado passa a ser uma server action chamável do browser.
function revalidateCompanionMedia() {
  revalidateTag('companion', 'max');
  revalidateTag('companions', 'max');
  revalidateTag('companions-filter', 'max');
}

export async function getImagesByAuthId(
  authId: string
): Promise<
  {
    publicUrl: string;
    storagePath: string;
    position: number;
    focalX: number;
    focalY: number;
    zoom: number;
  }[]
> {
  const images = await db
    .select({
      publicUrl: imagesTable.public_url,
      storagePath: imagesTable.storage_path,
      position: imagesTable.position,
      focalX: imagesTable.focal_x,
      focalY: imagesTable.focal_y,
      zoom: imagesTable.zoom,
    })
    .from(imagesTable)
    .where(eq(imagesTable.authId, authId))
    .orderBy(asc(imagesTable.position), asc(imagesTable.id));

  return JSON.parse(JSON.stringify(images));
}

export async function deleteImage(
  storagePath: string,
  bucket: string = 'images'
): Promise<void> {

  const removeFromBucket = supabase.storage.from(bucket).remove([storagePath]);
  const removeFromDb = db.delete(imagesTable).where(eq(imagesTable.storage_path, storagePath));

  await Promise.all([removeFromBucket, removeFromDb]);

  revalidateCompanionMedia();
}

/**
 * Grava a ordem escolhida pela anunciante. Recebe os caminhos de armazenamento
 * já na ordem final, e a posição de cada foto passa a ser o seu índice.
 */
export async function updateImagesOrder(
  orderedStoragePaths: string[]
): Promise<{ success: boolean; error?: string; }> {
  try {
    const clerkId = (await auth()).userId;
    if (!clerkId) return { success: false, error: 'Não autenticado' };
    if (orderedStoragePaths.length === 0) return { success: true };

    // Só reordena fotos que sejam mesmo desta conta, para o caminho de
    // armazenamento de outra pessoa não poder ser injectado no pedido.
    const owned = await db
      .select({ storagePath: imagesTable.storage_path })
      .from(imagesTable)
      .where(
        and(
          eq(imagesTable.authId, clerkId),
          inArray(imagesTable.storage_path, orderedStoragePaths)
        )
      );

    const ownedPaths = new Set(owned.map((image) => image.storagePath));
    const pathsToUpdate = orderedStoragePaths.filter((path) => ownedPaths.has(path));

    if (pathsToUpdate.length !== orderedStoragePaths.length) {
      return { success: false, error: 'Existem fotos que não pertencem a esta conta' };
    }

    await db.transaction(async (tx) => {
      for (let index = 0; index < pathsToUpdate.length; index++) {
        await tx
          .update(imagesTable)
          .set({ position: index })
          .where(
            and(
              eq(imagesTable.storage_path, pathsToUpdate[index]),
              eq(imagesTable.authId, clerkId)
            )
          );
      }
    });

    revalidateCompanionMedia();

    return { success: true };
  } catch (error) {
    console.error('Falha ao reordenar imagens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Guarda o enquadramento de uma foto sem tocar no ficheiro original: ponto
 * focal em percentagem e zoom em percentagem. Pode ser alterado as vezes que
 * forem precisas, e volta ao centro pondo 50/50 com zoom 100.
 */
export async function updateImageFraming(
  storagePath: string,
  framing: { focalX: number; focalY: number; zoom: number; }
): Promise<{ success: boolean; error?: string; }> {
  try {
    const clerkId = (await auth()).userId;
    if (!clerkId) return { success: false, error: 'Não autenticado' };

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, Math.round(value)));

    const [updated] = await db
      .update(imagesTable)
      .set({
        focal_x: clamp(framing.focalX, 0, 100),
        focal_y: clamp(framing.focalY, 0, 100),
        zoom: clamp(framing.zoom, 100, 300),
      })
      .where(
        and(
          eq(imagesTable.storage_path, storagePath),
          eq(imagesTable.authId, clerkId)
        )
      )
      .returning({ id: imagesTable.id });

    if (!updated) return { success: false, error: 'Foto não encontrada' };

    revalidateCompanionMedia();

    return { success: true };
  } catch (error) {
    console.error('Falha ao guardar enquadramento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export async function getImagesByCompanionId(
  companionId: number,
  limit: number = 3,
  offset: number = 0
): Promise<{
  images: {
    publicUrl: string;
    isVerificationVideo: boolean;
    focalX: number;
    focalY: number;
    zoom: number;
  }[];
  total: number;
}> {

  const conditions: SQL[] = [
    eq(imagesTable.companionId, companionId),
    eq(imagesTable.is_verification_video, false)];

  const [images, [{ count }]] = await Promise.all([
    db
      .select({
        publicUrl: imagesTable.public_url,
        isVerificationVideo: imagesTable.is_verification_video,
        focalX: imagesTable.focal_x,
        focalY: imagesTable.focal_y,
        zoom: imagesTable.zoom,
      })
      .from(imagesTable)
      .where(and(...conditions))
      // Sem esta ordenação o LIMIT/OFFSET não tem ordem garantida, e as páginas
      // seguintes podiam repetir ou saltar fotos.
      .orderBy(asc(imagesTable.position), asc(imagesTable.id))
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

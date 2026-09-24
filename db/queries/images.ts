'use server';

import { createClient } from '@supabase/supabase-js';
import { db } from '..';
import { companionsTable, imagesTable } from '../schema';
import { auth } from '@clerk/nextjs/server';
import { and, asc, eq, inArray, notInArray, SQL, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { isAdmin } from '@/components/header';

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

    // Se o perfil já está no ar, a foto nova fica invisível ao público até
    // ser vista por um admin; o anúncio aprovado continua como estava. Num
    // registo por aprovar não é preciso: o perfil inteiro ainda está escondido.
    const [companion] = await db
      .select({ verified: companionsTable.verified })
      .from(companionsTable)
      .where(eq(companionsTable.id, companionId))
      .limit(1);

    await db.insert(imagesTable).values({
      companionId: companionId,
      authId: clerkId,
      storage_path: path,
      public_url: data.publicUrl,
      position: Number(nextPosition) || 0,
      pending_approval: companion?.verified === true,
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

/**
 * Mesmo enquadramento, mas para o admin ajustar a foto de outra pessoa durante
 * a verificação. Fica separado de updateImageFraming de propósito: aquele
 * confirma que a foto pertence a quem está a gravar, e é essa verificação que
 * não pode ser afrouxada só para servir os dois casos.
 */
export async function updateImageFramingAsAdmin(
  storagePath: string,
  framing: { focalX: number; focalY: number; zoom: number; }
): Promise<{ success: boolean; error?: string; }> {
  try {
    const clerkId = (await auth()).userId;
    if (!clerkId || !isAdmin(clerkId)) {
      return { success: false, error: 'Não autorizado' };
    }

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, Math.round(value)));

    const [updated] = await db
      .update(imagesTable)
      .set({
        focal_x: clamp(framing.focalX, 0, 100),
        focal_y: clamp(framing.focalY, 0, 100),
        zoom: clamp(framing.zoom, 100, 300),
      })
      .where(eq(imagesTable.storage_path, storagePath))
      .returning({ id: imagesTable.id });

    if (!updated) return { success: false, error: 'Foto não encontrada' };

    revalidateCompanionMedia();

    return { success: true };
  } catch (error) {
    console.error('Falha ao guardar enquadramento como admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Mesma reordenação, mas para o admin mexer nas fotos de outra pessoa durante
 * a verificação. Fica separada de updateImagesOrder de propósito: aquela
 * confirma que as fotos pertencem a quem está a gravar, e é essa verificação
 * que não pode ser afrouxada só para servir os dois casos.
 *
 * Recebe apenas as fotos que o admin vê no carrossel. As restantes imagens do
 * mesmo perfil — vídeos, sobretudo — são empurradas para trás destas, senão
 * ficavam com posições a colidir com as novas e a ordem final passava a
 * depender do desempate por id.
 */
export async function updateImagesOrderAsAdmin(
  companionId: number,
  orderedStoragePaths: string[]
): Promise<{ success: boolean; error?: string; }> {
  try {
    const clerkId = (await auth()).userId;
    if (!clerkId || !isAdmin(clerkId)) {
      return { success: false, error: 'Não autorizado' };
    }
    if (orderedStoragePaths.length === 0) return { success: true };

    // Só aceita caminhos que sejam mesmo deste perfil, para o pedido não
    // poder mexer nas fotos de outra pessoa.
    const doPerfil = await db
      .select({ storagePath: imagesTable.storage_path })
      .from(imagesTable)
      .where(
        and(
          eq(imagesTable.companionId, companionId),
          inArray(imagesTable.storage_path, orderedStoragePaths)
        )
      );

    const validos = new Set(doPerfil.map((i) => i.storagePath));
    if (validos.size !== orderedStoragePaths.length) {
      return { success: false, error: 'Existem fotos que não são deste perfil' };
    }

    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedStoragePaths.length; i++) {
        await tx
          .update(imagesTable)
          .set({ position: i })
          .where(
            and(
              eq(imagesTable.companionId, companionId),
              eq(imagesTable.storage_path, orderedStoragePaths[i])
            )
          );
      }

      // Tudo o resto vai para depois das fotos reordenadas.
      await tx
        .update(imagesTable)
        .set({ position: orderedStoragePaths.length })
        .where(
          and(
            eq(imagesTable.companionId, companionId),
            notInArray(imagesTable.storage_path, orderedStoragePaths)
          )
        );
    });

    revalidateCompanionMedia();
    return { success: true };
  } catch (error) {
    console.error('Falha ao reordenar fotos como admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Publica as fotos que estavam à espera. Chamada pela aprovação do perfil,
 * que é o único momento em que conteúdo novo passa a ser visível.
 */
export async function approvePendingImages(
  companionId: number
): Promise<{ success: boolean; error?: string; }> {
  const clerkId = (await auth()).userId;
  if (!clerkId || !isAdmin(clerkId)) {
    return { success: false, error: 'Não autorizado' };
  }

  await db
    .update(imagesTable)
    .set({ pending_approval: false })
    .where(
      and(
        eq(imagesTable.companionId, companionId),
        eq(imagesTable.pending_approval, true)
      )
    );

  revalidateCompanionMedia();
  return { success: true };
}

/**
 * Deita fora as fotos que a acompanhante juntou numa edição recusada, do
 * armazenamento e da base. As que já estavam aprovadas não são tocadas: o
 * anúncio que está no ar tem de continuar exactamente como estava.
 */
export async function discardPendingImages(
  companionId: number
): Promise<{ success: boolean; error?: string; }> {
  const clerkId = (await auth()).userId;
  if (!clerkId || !isAdmin(clerkId)) {
    return { success: false, error: 'Não autorizado' };
  }

  const pending = await db
    .select({ storagePath: imagesTable.storage_path })
    .from(imagesTable)
    .where(
      and(
        eq(imagesTable.companionId, companionId),
        eq(imagesTable.pending_approval, true)
      )
    );

  if (pending.length === 0) return { success: true };

  await Promise.all([
    supabase.storage.from('images').remove(pending.map((p) => p.storagePath)),
    db
      .delete(imagesTable)
      .where(
        and(
          eq(imagesTable.companionId, companionId),
          eq(imagesTable.pending_approval, true)
        )
      ),
  ]);

  revalidateCompanionMedia();
  return { success: true };
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
    eq(imagesTable.is_verification_video, false),
    // Fotos de uma edição por aprovar não aparecem no perfil público: o
    // visitante continua a ver o conjunto que foi aprovado.
    eq(imagesTable.pending_approval, false)];

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

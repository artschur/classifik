'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { createDbStory, deleteDbStory, setDbStoryFeatured } from '@/db/queries/stories';
import { isAdmin } from '@/components/header';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function createStoryAction(
  formData: FormData,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) return { success: false, error: 'Não autorizado' };

  try {
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const collection = formData.get('collection') as string;
    const collectionSlug = formData.get('collectionSlug') as string;
    const excerpt = formData.get('excerpt') as string;
    const author = (formData.get('author') as string) || 'Onesugar';
    const readTime = parseInt(formData.get('readTime') as string) || 5;
    const featured = formData.get('featured') === 'true';
    const publishedAtRaw = formData.get('publishedAt') as string | null;
    const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
    const paragraphCount = parseInt(formData.get('paragraphCount') as string) || 0;

    const paragraphs: string[] = [];
    for (let i = 0; i < paragraphCount; i++) {
      const p = formData.get(`paragraph_${i}`) as string;
      if (p?.trim()) paragraphs.push(p.trim());
    }

    // Upload cover image
    let coverImageUrl: string | undefined;
    let coverStoragePath: string | undefined;
    const coverFile = formData.get('coverImage') as File | null;
    if (coverFile && coverFile.size > 0) {
      const ext = coverFile.name.split('.').pop() ?? 'jpg';
      const path = `stories/${slug}/cover-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('images').upload(path, coverFile);
      if (error) throw new Error(`Cover upload failed: ${error.message}`);
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      coverImageUrl = data.publicUrl;
      coverStoragePath = path;
    }

    // Upload inline images
    const inlineImagesJson = formData.get('inlineImagesJson') as string | null;
    const inlineImages: { afterIndex: number; src: string; storagePath: string; alt: string }[] = [];
    if (inlineImagesJson) {
      const parsed = JSON.parse(inlineImagesJson) as { afterIndex: number; alt: string }[];
      for (const item of parsed) {
        const file = formData.get(`inlineImage_${item.afterIndex}`) as File | null;
        if (file && file.size > 0) {
          const ext = file.name.split('.').pop() ?? 'jpg';
          const path = `stories/${slug}/inline-${item.afterIndex}-${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from('images').upload(path, file);
          if (!error) {
            const { data } = supabase.storage.from('images').getPublicUrl(path);
            inlineImages.push({ afterIndex: item.afterIndex, src: data.publicUrl, storagePath: path, alt: item.alt });
          }
        }
      }
    }

    await createDbStory({
      slug,
      title,
      collection,
      collection_slug: collectionSlug,
      cover_image_url: coverImageUrl,
      cover_storage_path: coverStoragePath,
      excerpt,
      author,
      read_time: readTime,
      featured,
      published_at: publishedAt,
      paragraphs,
      inline_images: inlineImages,
    });

    revalidatePath('/contos');
    revalidatePath(`/contos/${slug}`);
    return { success: true, slug };
  } catch (err) {
    console.error(err);
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao criar conto' };
  }
}

/**
 * Marca um conto já publicado como o destaque de /contos. Só um conto pode
 * estar em destaque de cada vez — setDbStoryFeatured já trata de retirar o
 * destaque de qualquer outro antes de o atribuir a este.
 */
export async function setFeaturedStoryAction(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) return { success: false, error: 'Não autorizado' };

  try {
    await setDbStoryFeatured(id);
    revalidatePath('/contos');
    revalidatePath('/admin/contos');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao marcar destaque' };
  }
}

export async function deleteStoryAction(
  id: number,
  storagePaths: string[],
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) return { success: false, error: 'Não autorizado' };

  try {
    if (storagePaths.length > 0) {
      await supabase.storage.from('images').remove(storagePaths);
    }
    await deleteDbStory(id);
    revalidatePath('/contos');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao eliminar conto' };
  }
}

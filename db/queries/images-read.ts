// Leitura das fotos aprovadas de um perfil, só para código do servidor.
//
// Não é 'use server' de propósito: as funções daqui não ficam chamáveis pelo
// navegador. A versão que o navegador chama (getImagesByCompanionId, em
// images.ts) passa primeiro pela verificação de quem pode ver o perfil. Esta é
// usada dentro do unstable_cache do perfil, onde não se pode ler a sessão.
import { and, asc, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '..';
import { imagesTable } from '../schema';

export type FotosDoPerfil = {
  images: {
    publicUrl: string;
    isVerificationVideo: boolean;
    focalX: number;
    focalY: number;
    zoom: number;
  }[];
  total: number;
};

export async function readCompanionImages(
  companionId: number,
  limit: number = 3,
  offset: number = 0,
): Promise<FotosDoPerfil> {
  const conditions: SQL[] = [
    eq(imagesTable.companionId, companionId),
    eq(imagesTable.is_verification_video, false),
    // Fotos de uma edição por aprovar não aparecem no perfil público: o
    // visitante continua a ver o conjunto que foi aprovado.
    eq(imagesTable.pending_approval, false),
  ];

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
      .where(and(...conditions)),
  ]);

  return { images, total: count };
}

import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '..';
import { citiesTable, companionsTable, imagesTable } from '../schema';
import { isAdmin } from '@/components/header';
import { isImportedAuthId } from '@/lib/imported-profiles';
import { previewToken } from '@/lib/preview-token';

export type PausedCompanion = {
  id: number;
  name: string;
  city: string;
  coverUrl: string | null;
  updatedAt: Date | null;
  identityVerified: boolean;
  /** Perfil importado ainda sem conta dela: quem decide pô-lo no ar é o admin. */
  imported: boolean;
  /** Só nos importados: link que abre o perfil mesmo em pausa. */
  previewPath: string | null;
};

/**
 * Perfis publicados mas escondidos, para o separador "Em pausa" do /verify.
 * Até aqui um perfil pausado só se encontrava pelo endereço directo.
 */
export async function getPausedCompanions(): Promise<PausedCompanion[]> {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    throw new Error('Não autorizado');
  }

  const rows = await db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      authId: companionsTable.auth_id,
      city: citiesTable.city,
      updatedAt: companionsTable.updated_at,
      identityVerified: companionsTable.identity_verified,
      coverUrl: sql<string | null>`(
        select ${imagesTable.public_url} from ${imagesTable}
        where ${imagesTable.companionId} = ${companionsTable.id}
          and ${imagesTable.is_verification_video} = false
        order by ${imagesTable.position} asc, ${imagesTable.id} asc
        limit 1
      )`,
    })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .where(and(eq(companionsTable.verified, true), eq(companionsTable.paused, true)))
    .orderBy(desc(companionsTable.updated_at), asc(companionsTable.id));

  return rows.map(({ authId, ...row }) => {
    const imported = isImportedAuthId(authId);
    return {
      ...row,
      imported,
      previewPath: imported ? `/companions/${row.id}?ver=${previewToken(row.id)}` : null,
    };
  });
}

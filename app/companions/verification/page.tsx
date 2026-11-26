import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { companionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resumoDocumentos } from '@/db/queries/verificacao';
import { PassosRegisto } from '@/components/registo/passos-registo';
import { VerificacaoPasso } from '@/components/registo/verificacao-passo';
import { getLocale } from '@/lib/locale.server';
import { localizeHref } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

/**
 * Passo 4 do registo: vídeo e documento. Também é para onde levam os avisos
 * de verificação por fazer ou recusada, e a compra de um plano sem selo.
 * `?registo=1` vem do passo 3: mostra os passos e segue para o perfil criado.
 */
export default async function VideoVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ registo?: string }>;
}) {
  const { userId } = await auth();
  const locale = await getLocale();
  const registo = (await searchParams).registo === '1';

  if (!userId) redirect(localizeHref('/', locale));

  const [companion] = await db
    .select({ id: companionsTable.id, identityVerified: companionsTable.identity_verified })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, userId))
    .limit(1)
    .catch(() => [null]);

  if (!companion) redirect(localizeHref('/companions/register', locale));

  // Quem já tem a identidade verificada não tem nada a fazer aqui: o vídeo e
  // o documento já foram vistos.
  if (companion.identityVerified) {
    redirect(localizeHref(registo ? '/companions/register/criado' : '/profile', locale));
  }

  const documentos = await resumoDocumentos(companion.id);

  return (
    <div className="container mx-auto py-12 px-4">
      {registo && <PassosRegisto atual={4} />}
      <VerificacaoPasso
        video={documentos.video}
        documento={documentos.documento}
        motivoRecusa={documentos.motivoRecusa}
        registo={registo}
      />
    </div>
  );
}

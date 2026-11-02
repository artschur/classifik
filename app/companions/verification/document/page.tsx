import { redirect } from 'next/navigation';
import { getLocale } from '@/lib/locale.server';
import { localizeHref } from '@/lib/i18n';

/**
 * O vídeo e o documento passaram a ser enviados na mesma página (passo 4 do
 * registo). Este endereço fica para quem o tenha guardado.
 */
export default async function DocumentVerificationPage() {
  redirect(localizeHref('/companions/verification', await getLocale()));
}

import type { Metadata } from 'next';
import { LocaleLink } from '@/components/locale-link';
import { getLocale } from '@/lib/locale.server';

/**
 * Página 404 do site, nas duas línguas.
 *
 * Quem chega aqui vem quase sempre de um perfil que saiu do ar ou de um link
 * antigo para um distrito. Em vez do "This page could not be found" do Next,
 * a página leva logo à lista de distritos e aos perfis. O rodapé continua a
 * mostrar os 19 distritos.
 */
export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: true },
};

const TEXT = {
  pt: {
    titulo: 'Esta página não está disponível',
    texto:
      'O perfil pode ter saído do ar ou o endereço mudou. Os perfis verificados continuam disponíveis por distrito.',
    distritos: 'Ver distritos',
    perfis: 'Ver todos os perfis',
  },
  en: {
    titulo: 'This page is not available',
    texto:
      'The profile may have been removed or the address has changed. Verified profiles are still available by district.',
    distritos: 'Browse districts',
    perfis: 'See all profiles',
  },
} as const;

export default async function NotFound() {
  const locale = await getLocale();
  const t = TEXT[locale];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-bold">{t.titulo}</h1>
      <p className="mt-4 max-w-md text-muted-foreground">{t.texto}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LocaleLink
          locale={locale}
          href="/location"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          {t.distritos}
        </LocaleLink>
        <LocaleLink
          locale={locale}
          href="/companions"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium"
        >
          {t.perfis}
        </LocaleLink>
      </div>
    </div>
  );
}

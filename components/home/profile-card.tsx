import Image from 'next/image';
import { BadgeCheck, Camera, MapPin, Star } from 'lucide-react';
import { framingStyle } from '@/lib/image-framing';
import { LocaleLink } from '@/components/locale-link';
import { nomeDistrito } from '@/lib/districts';
import type { Locale } from '@/lib/i18n';
import type { CatalogCompanion } from '@/db/queries/catalog';

const PLANO: Record<string, { label: Record<Locale, string>; className: string }> = {
  vip: { label: { pt: 'VIP', en: 'VIP' }, className: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-950' },
  plus: { label: { pt: 'Plus', en: 'Plus' }, className: 'bg-gradient-to-r from-orange-400 to-rose-500 text-white' },
  classic: { label: { pt: 'Clássico', en: 'Classic' }, className: 'bg-rose-600 text-white' },
};

const GENERO: Record<string, Record<Locale, string>> = {
  feminino: { pt: 'Mulher', en: 'Woman' },
  masculino: { pt: 'Homem', en: 'Man' },
  trans: { pt: 'Trans', en: 'Trans' },
};

const TEXT = {
  pt: {
    anos: 'anos',
    ver: 'Ver perfil',
    verificada: 'Verificada',
    alt: (nome: string, cidade: string) => `${nome}, acompanhante em ${cidade}`,
  },
  en: {
    anos: 'years old',
    ver: 'View profile',
    verificada: 'Verified',
    alt: (nome: string, cidade: string) => `${nome}, escort in ${cidade}`,
  },
} as const;

/**
 * Cartão de uma sugar no catálogo e nos destaques da página principal: foto
 * com o enquadramento escolhido, plano, número de fotos, nome, idade,
 * distrito e avaliações (só quando existem).
 */
export function ProfileCard({
  sugar,
  priority = false,
  locale = 'pt',
}: {
  sugar: CatalogCompanion;
  priority?: boolean;
  locale?: Locale;
}) {
  const t = TEXT[locale];
  const plano = PLANO[sugar.planType?.toLowerCase()];
  const genero = GENERO[sugar.gender?.toLowerCase()]?.[locale];
  const cidade = nomeDistrito(sugar.citySlug || sugar.city, locale);

  return (
    <LocaleLink
      locale={locale}
      href={`/companions/${sugar.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {sugar.cover ? (
          <Image
            src={sugar.cover.url}
            alt={t.alt(sugar.name, cidade)}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            style={framingStyle(sugar.cover)}
            priority={priority}
          />
        ) : (
          <Image src="/image.png" alt={sugar.name} fill className="object-cover" />
        )}
        {plano && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide shadow ${plano.className}`}
          >
            {plano.label[locale]}
          </span>
        )}
        {sugar.photoCount > 0 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
            <Camera className="h-3 w-3" />
            {sugar.photoCount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold">{sugar.name}</span>
          {/* O selo é só para quem confirmou a identidade com documento. */}
          {sugar.identityVerified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-label={t.verificada} />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {sugar.age} {t.anos}
          {genero ? ` • ${genero}` : ''}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-rose-500" />
          {cidade}
        </p>
        {sugar.reviewCount > 0 && sugar.rating !== null && (
          <p className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-medium">{sugar.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({sugar.reviewCount})</span>
          </p>
        )}
        <span className="mt-auto pt-2">
          <span className="block w-full rounded-lg bg-rose-600 py-2 text-center text-sm font-semibold text-white transition-colors group-hover:bg-rose-500">
            {t.ver}
          </span>
        </span>
      </div>
    </LocaleLink>
  );
}

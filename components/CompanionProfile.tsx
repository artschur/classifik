import { getCompanionById } from '@/db/queries';
import type React from 'react';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  MessageCircle,
  Phone,
  Check,
  Cake,
  MapPin,
  Ruler,
  Weight,
  Globe,
  Eye,
  User,
  Droplet,
  PenTool,
  Gem,
  Cigarette,
  Share2,
  Heart,
  Star,
  CheckCircle,
  Info,
} from 'lucide-react';
import { ImageGrid } from '@/components/imageGrid';
import { getLastSignInByClerkId } from '@/db/queries/userActions';
import { WhatsAppButton } from './ui/whatsapp-button';

import {
  getImagesByCompanionId,
  getVerificationVideosByCompanionId,
} from '@/db/queries/images';
import { InstagramButton } from './ui/instagramButton';
import { getAudioUrlByCompanionId } from '@/db/queries/audio';
import AudioPlayer from '@/audio-player';
import { IconMicrophone } from '@tabler/icons-react';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/components/header';
import { AdminProfileControls } from './admin-profile-controls';
import { getCompanionDistrict } from '@/db/queries/companions';
import { distritoPorSlug, inDistrict, nomeDistrito, type Distrito } from '@/lib/districts';
import { getLocale } from '@/lib/locale.server';
import { absoluteUrl, localizeHref, type Locale } from '@/lib/i18n';
import { traduzirValor } from '@/lib/i18n-values';
import { LocaleLink } from '@/components/locale-link';

const TEXT = {
  pt: {
    home: 'Início',
    verified: 'Verificada',
    voice: 'Ouça minha voz',
    about: (n: string) => `Sobre ${n}`,
    originalNote: '',
    age: 'Idade',
    years: 'anos',
    height: 'Altura',
    weight: 'Peso',
    ethnicity: 'Etnia',
    eyes: 'Cor dos olhos',
    hair: 'Cor do cabelo',
    silicone: 'Silicone',
    tattoos: 'Tatuagens',
    piercings: 'Piercings',
    smoker: 'Fumante',
    hotel: 'Atende em Hotel',
    ownPlace: 'Atende em Local Próprio',
    yes: 'Sim',
    no: 'Não',
    perHour: '/hora',
    languages: 'Idiomas',
  },
  en: {
    home: 'Home',
    verified: 'Verified',
    voice: 'Listen to my voice',
    about: (n: string) => `About ${n}`,
    originalNote: 'Description written by the advertiser, in Portuguese.',
    age: 'Age',
    years: 'years old',
    height: 'Height',
    weight: 'Weight',
    ethnicity: 'Ethnicity',
    eyes: 'Eye colour',
    hair: 'Hair colour',
    silicone: 'Implants',
    tattoos: 'Tattoos',
    piercings: 'Piercings',
    smoker: 'Smoker',
    hotel: 'Hotel visits',
    ownPlace: 'Own place',
    yes: 'Yes',
    no: 'No',
    perHour: '/hour',
    languages: 'Languages',
  },
} as const;

/** "há 3 horas" passa a "3 hours ago" na versão inglesa. */
function ultimaVisitaEn(texto: string): string {
  if (texto === 'há menos de uma hora') return 'less than an hour ago';
  if (texto === 'Nunca') return 'Never';
  const m = texto.match(/^há (\d+) (hora|horas|dia|dias)$/);
  if (!m) return texto;
  const n = Number(m[1]);
  const unidade = m[2].startsWith('hora') ? 'hour' : 'day';
  return `${n} ${unidade}${n === 1 ? '' : 's'} ago`;
}

const SITE_URL = 'https://www.onesugar.pt';

/**
 * Dados estruturados do perfil: ProfilePage com a acompanhante (Person) como
 * entidade principal e o caminho Início > distrito > perfil. Liga o perfil ao
 * site e à organização pelos @id declarados no layout e na home, para o
 * buscador (e os assistentes de IA) lerem cada perfil como uma pessoa com
 * localidade, e não como uma página solta.
 *
 * Ficam de fora de propósito telefone, Instagram e preço: o contacto não
 * deve circular em texto aberto fora do botão.
 */
function profileJsonLd({
  id,
  nome,
  descricao,
  imagem,
  idiomas,
  distrito,
  locale,
}: {
  id: number;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  idiomas: string[];
  distrito: Distrito | null;
  locale: Locale;
}) {
  const en = locale === 'en';
  const url = absoluteUrl(`/companions/${id}`, locale);
  const distritoNome = distrito ? (en ? inDistrict(distrito.slug) : distrito.emNome) : '';
  const breadcrumb = [
    { name: en ? 'Home' : 'Início', item: en ? `${SITE_URL}/en` : `${SITE_URL}/` },
    ...(distrito
      ? [
          {
            name: en ? `Escorts ${distritoNome}` : `Acompanhantes ${distritoNome}`,
            // Os distritos ainda podem não ter versão inglesa: o caminho
            // aponta para o endereço que de facto existe.
            item: `${SITE_URL}${localizeHref(`/location/${distrito.slug}`, locale)}`,
          },
        ]
      : []),
    { name: nome, item: url },
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${url}#profilepage`,
        url,
        name: distrito
          ? en
            ? `${nome}, escort ${distritoNome}`
            : `${nome}, acompanhante ${distritoNome}`
          : nome,
        inLanguage: en ? 'en' : 'pt-PT',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        mainEntity: { '@id': `${url}#person` },
      },
      {
        '@type': 'Person',
        '@id': `${url}#person`,
        name: nome,
        url,
        ...(descricao ? { description: descricao } : {}),
        ...(imagem ? { image: imagem } : {}),
        ...(idiomas.length
          ? { knowsLanguage: idiomas.map((l) => traduzirValor(l, locale)) }
          : {}),
        ...(distrito
          ? {
              homeLocation: {
                '@type': 'Place',
                name: en ? nomeDistrito(distrito.slug, 'en') : distrito.nome,
                address: {
                  '@type': 'PostalAddress',
                  addressRegion: en ? nomeDistrito(distrito.slug, 'en') : distrito.nome,
                  addressCountry: 'PT',
                },
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: breadcrumb.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.item,
        })),
      },
    ],
  };
}

async function LastSignIn({ clerkId, locale }: { clerkId: string; locale: Locale }) {
  const lastSignIn = await getLastSignInByClerkId(clerkId);
  return <span>{locale === 'en' ? ultimaVisitaEn(String(lastSignIn)) : lastSignIn}</span>;
}

export async function CompanionProfile({
  id,
  reviewsRating,
}: {
  id: number;
  reviewsRating: number | 'Sem avaliações';
}) {
  const [companion, { images, total }, audio, district, locale] =
    await Promise.all([
      getCompanionById(id),
      getImagesByCompanionId(id, 3, 0),
      // getVerificationVideosByCompanionId(id),
      getAudioUrlByCompanionId(id),
      getCompanionDistrict(id).catch(() => null),
      getLocale(),
    ]);
  const t = TEXT[locale];
  const en = locale === 'en';

  const { userId } = await auth();
  const viewerIsAdmin = Boolean(userId && isAdmin(userId));

  // Anúncio pausado, ou por aprovar: invisível ao público. O admin é a
  // excepção, senão perdia o acesso à página onde estão os próprios
  // controlos e não tinha como reverter o que acabou de fazer.
  const hiddenFromPublic = companion.paused || !companion.verified;
  if (hiddenFromPublic && !viewerIsAdmin) notFound();

  let sanitizedPhone = companion.phone.replace(/\D/g, '').replace(/^0+/, '');

  const initialMedia = images.map((img) => ({
    type:
      img.publicUrl.match(/\.(mp4|webm|ogg|mov)$/i) && !img.isVerificationVideo
        ? ('video' as const)
        : ('image' as const),
    publicUrl: img.publicUrl,
    focalX: img.focalX,
    focalY: img.focalY,
    zoom: img.zoom,
  }));
  const nome = companion.name.trim();
  const distrito = district ? distritoPorSlug(district.slug, district.city) : null;
  const primeiraFoto =
    initialMedia.find((m) => m.type === 'image')?.publicUrl ?? null;
  const jsonLd = profileJsonLd({
    id,
    nome,
    descricao: companion.shortDescription?.trim() || null,
    imagem: primeiraFoto,
    idiomas: Array.isArray(companion.languages) ? companion.languages : [],
    distrito,
    locale,
  });

  return (
    <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {/* Caminho até ao perfil. O link para o distrito devolve autoridade à
          página do distrito e é o mesmo caminho descrito no BreadcrumbList. */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <LocaleLink locale={locale} href="/" className="hover:underline">
              {t.home}
            </LocaleLink>
          </li>
          {distrito && (
            <>
              <li aria-hidden="true">›</li>
              <li>
                <LocaleLink
                  locale={locale}
                  href={`/location/${distrito.slug}`}
                  className="hover:underline text-rose-500"
                >
                  {en ? `Escorts ${inDistrict(distrito.slug)}` : `Acompanhantes ${distrito.emNome}`}
                </LocaleLink>
              </li>
            </>
          )}
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-foreground">
            {nome}
          </li>
        </ol>
      </nav>
      {viewerIsAdmin && (
        <AdminProfileControls
          companionId={id}
          name={companion.name}
          paused={companion.paused}
          verified={companion.verified}
          // plan_type = 'vip' fica gravado mesmo depois de expirar, por isso
          // a data é que decide se o VIP ainda vale.
          vipActive={
            companion.plan_type === 'vip' &&
            companion.ad_expiration_date !== null &&
            new Date(companion.ad_expiration_date) > new Date()
          }
          isSugarOfDay={companion.is_sugar_of_day}
        />
      )}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{companion.name}</h1>
        <div className="flex items-center mt-2 space-x-4">
          {companion.verified && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" /> {t.verified}
            </Badge>
          )}
          <div className="flex items-center text-yellow-400">
            <Star className="w-5 h-5 mr-1" />
            <span className="font-semibold">{reviewsRating}</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            <Suspense fallback={<Skeleton className="h-4 w-24" />}>
              <LastSignIn clerkId={companion.auth_id} locale={locale} />
            </Suspense>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <ImageGrid
            initialImages={initialMedia}
            companionId={id}
            totalImages={total}
          />
          <Card className="mt-8">
            <CardContent className="p-6">
              {audio && (
                <div className="flex flex-col w-full gap-4 pb-4">
                  <h2 className="text-xl">
                    <IconMicrophone className="inline-block mr-2" />
                    {t.voice}
                  </h2>
                  <AudioPlayer songUrl={audio.publicUrl} />
                </div>
              )}
              <h2 className="text-2xl font-semibold mb-4 max-">
                {t.about(nome)}
              </h2>
              {en && (
                <p className="text-xs text-muted-foreground mb-2 italic">{t.originalNote}</p>
              )}
              <p
                lang={en ? 'pt-PT' : undefined}
                className="text-muted-foreground mb-6 whitespace-normal truncate break-words overflow-wrap-anywhere"
              >
                {companion.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6">
                <CharacteristicItem
                  label={t.age}
                  value={companion.age == 40 ? `${companion.age}+ ${t.years}` : `${companion.age} ${t.years}`}
                />
                <CharacteristicItem
                  label={t.height}
                  // O formulário grava a altura em metros (1,70), por isso
                  // mostrá-la como está dava "1.7 cm".
                  value={`${Math.round(Number(companion.height) * 100)} cm`}
                />
                <CharacteristicItem
                  label={t.weight}
                  value={`${companion.weight} kg`}
                />
                <CharacteristicItem label={t.ethnicity} value={traduzirValor(companion.ethnicity, locale)} />
                <CharacteristicItem
                  label={t.eyes}
                  value={traduzirValor(companion.eyeColor, locale)}
                />
                <CharacteristicItem
                  label={t.hair}
                  value={traduzirValor(companion.hairColor, locale)}
                />
                <CharacteristicItem
                  label={t.silicone}
                  value={companion.silicone ? t.yes : t.no}
                />
                <CharacteristicItem
                  label={t.tattoos}
                  value={companion.tattoos ? t.yes : t.no}
                />
                <CharacteristicItem
                  label={t.piercings}
                  value={companion.piercings ? t.yes : t.no}
                />
                {companion.smoker !== undefined && (
                  <CharacteristicItem
                    label={t.smoker}
                    value={companion.smoker ? t.yes : t.no}
                  />
                )}
                <CharacteristicItem
                  label={t.hotel}
                  value={companion.meets_at_hotel ? t.yes : t.no}
                />
                <CharacteristicItem
                  label={t.ownPlace}
                  value={companion.meets_at_own_place ? t.yes : t.no}
                />
              </div>
            </CardContent>
          </Card>
          {/*<Card className="w-full shadow-md mt-8">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold">
                  Vídeo de Verificação
                </CardTitle>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                  <CheckCircle className="w-4 h-4 mr-1" /> Verificado
                </Badge>
              </div>
              <CardDescription className="text-base mt-2">
                Este vídeo serve para garantir a autenticidade do perfil e a
                segurança de nossos clientes.
              </CardDescription>
            </CardHeader>

            {/*<CardContent className="space-y-6">
              <div className="flex justify-center">
                {verificationVideo[0] && (
                  <video
                    controls
                    className="w-full max-h-[400px] rounded-lg border shadow-sm object-contain"
                    src={verificationVideo[0].publicUrl}
                  />
                )}
              </div>
              <div className="bg-stone-700/20 shadow-md p-4 rounded-lg border">
                <h3 className="font-medium mb-2">Detalhes do vídeo</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data de envio</p>
                    <p>
                      {verificationVideo[0] &&
                        new Date(
                          verificationVideo[0].createdAt
                        ).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p>Verificado pela equipe onesugar</p>
                  </div>
                </div>
              </div>
            </CardContent>*/}
          {/*</Card>*/}
        </div>

        <div>
          <Card className="sticky top-20">
            <CardContent className="p-6 gap-2 flex flex-col">
              <div
                lang={en ? 'pt-PT' : undefined}
                className="break-words overflow-wrap-anywhere whitespace-normal"
              >
                {companion.shortDescription}
              </div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-2xl font-bold">
                    € {companion.price}
                  </span>
                  <span className="text-muted-foreground">{t.perHour}</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="icon" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <WhatsAppButton
                phone={sanitizedPhone}
                companionId={id}
                className="w-full"
                inert={companion.is_demo}
              />
              {
                companion.instagramHandle && (
                  <InstagramButton
                    instagramHandle={companion.instagramHandle}
                    className="w-full"
                    companionId={id}
                    inert={companion.is_demo}
                  />)}

              <div className="mt-6 text-sm text-muted-foreground">
                <p>
                  {t.languages}:{' '}
                  {companion.languages.map((l) => traduzirValor(l, locale)).join(', ')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function CompanionSkeleton() {
  return (
    <div className="max-w-7xl p-5">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="flex items-center mt-2 space-x-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
          <span className="text-muted-foreground">·</span>
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-8">
            <div className="col-span-3 row-span-2">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            </div>
            <div className="col-span-1">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            </div>
            <div className="col-span-1">
              <Skeleton className="aspect-[4/4] w-full rounded-xl" />
            </div>
          </div>

          <Card className="mt-8">
            <CardContent className="p-6">
              <Skeleton className="h-7 w-48 mb-4" />
              <Skeleton className="h-24 w-full mb-6" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Skeleton className="h-7 w-32" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>

              <Skeleton className="h-10 w-full mb-3" />
              <Skeleton className="h-10 w-full" />

              <div className="mt-6">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CharacteristicItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

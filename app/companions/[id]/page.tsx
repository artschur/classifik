import { Suspense } from 'react';
import { ReviewsSkeleton } from '@/components/skeletons/skeletonReview';
import CompanionReviews from '@/components/companionReviews';
import {
  CompanionProfile,
  CompanionSkeleton,
} from '@/components/CompanionProfile';
import { getReviewsByCompanionId } from '@/db/queries/reviews';
import { PageViewTracker } from '@/components/analytics-components';
import { auth } from '@clerk/nextjs/server';
import {
  getCompanionDistrict,
  isUserBlocked,
} from '@/db/queries/companions';
import { BlockedProfileMessage } from '@/components/blocked-profile-message';
import { getCompanionById } from '@/db/queries';
import { distritoPorSlug, inDistrict } from '@/lib/districts';
import { getLocale } from '@/lib/locale.server';
import { OG_LOCALE, absoluteUrl, pageAlternates } from '@/lib/i18n';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);
  const companionId = parseInt(id);
  const path = `/companions/${id}`;

  try {
    const [companion, district] = await Promise.all([
      getCompanionById(companionId),
      getCompanionDistrict(companionId).catch(() => null),
    ]);

    // O nome chega como a anunciante o escreveu, às vezes com espaço no fim,
    // o que dava "Angelinne samya , acompanhante em Faro" no título.
    const nome = companion.name.trim();
    const distrito = district ? distritoPorSlug(district.slug, district.city) : null;

    // Textos escritos à mão para alguns perfis. O título fica sem a marca: o
    // template do layout acrescenta " | OneSugar" a todos os títulos.
    const customMetadata: Record<number, { title?: string; description: string }> = {
      184: {
        description: 'Gabi Mendes, 23 anos, estudante de sociologia, é uma morena charmosa, feminina e muito atraente.',
      },
      254: {
        title: distrito
          ? `Sophia | Especialista em Massagem Erótica ${distrito.emNome}`
          : 'Sophia | Especialista em Massagem Erótica',
        description: 'Descubra a experiência de massagem erótica de Sofia em um ambiente discreto e relaxante, com atmosfera tranquila, toque sensual e uma jornada única de prazer e conexão.',
      },
      183: {
        description: 'Conheça Luisa, massagista e modelo em Braga. Uma mulher sensual que oferece momentos intensos de prazer, relaxamento e experiências inesquecíveis. Entre em contato.',
      },
    };

    // "Bianca, acompanhante em Lisboa": distingue perfis com o mesmo nome e
    // leva o distrito para o título. Sem distrito, fica só o nome.
    const tituloPadrao = distrito
      ? `${nome}, acompanhante ${distrito.emNome}`
      : nome;

    const custom = customMetadata[companionId];
    let title: string = custom?.title ?? tituloPadrao;
    let description: string =
      custom?.description ||
      companion.shortDescription?.trim() ||
      `Conheça ${nome} na OneSugar.`;

    // Versão inglesa: as descrições são escritas pelas anunciantes em
    // português, por isso o título e a descrição para o Google são gerados
    // em inglês a partir do nome e do distrito.
    if (locale === 'en') {
      const onde = district ? ` ${inDistrict(district.slug)}` : '';
      title =
        companionId === 254
          ? `Sophia | Erotic Massage Specialist${onde}`
          : `${nome}, escort${onde}`;
      description = `${nome}, verified escort${onde}, Portugal. See her photos and details and contact her directly on OneSugar, with full discretion.`;
    }

    return {
      title,
      description,
      alternates: pageAlternates(path, locale),
      openGraph: {
        title: `${title} | OneSugar`,
        description,
        url: absoluteUrl(path, locale),
        locale: OG_LOCALE[locale],
      },
    };
  } catch (e) {
    return {
      title: locale === 'en' ? 'Escort' : 'Acompanhante',
    };
  }
}

export default async function CompanionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companionId = parseInt(id);

  // Check if user is blocked
  const { userId } = await auth();
  let isBlocked = false;

  if (userId) {
    isBlocked = await isUserBlocked(companionId, userId);
  }

  // If user is blocked, show blocked message
  if (isBlocked) {
    return <BlockedProfileMessage />;
  }

  const [reviews] = await Promise.all([getReviewsByCompanionId(companionId)]);
  const reviewsRating =
    reviews.length > 0
      ? reviews.map((review) => review.rating).sort((a, b) => a - b)[
          Math.floor(reviews.length / 2)
        ]
      : 'Sem avaliações';

  return (
    <div className="flex flex-col gap-4">
      <PageViewTracker companionId={companionId} />
      <Suspense fallback={<CompanionSkeleton />}>
        <CompanionProfile id={companionId} reviewsRating={reviewsRating} />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <CompanionReviews id={companionId} initialReviews={reviews} />
      </Suspense>
    </div>
  );
}

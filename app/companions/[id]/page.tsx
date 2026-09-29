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
  getCompanionCityName,
  isUserBlocked,
} from '@/db/queries/companions';
import { BlockedProfileMessage } from '@/components/blocked-profile-message';
import { getCompanionById } from '@/db/queries';
import type { Metadata } from 'next';

// Preposição certa antes do distrito: "no Porto", "na Guarda", "em Lisboa".
const PREPOSICAO_DISTRITO: Record<string, string> = {
  porto: 'no',
  guarda: 'na',
  madeira: 'na',
  'açores': 'nos',
  acores: 'nos',
};

function emDistrito(cidade: string): string {
  const prep = PREPOSICAO_DISTRITO[cidade.trim().toLowerCase()] ?? 'em';
  return `${prep} ${cidade.trim()}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const companionId = parseInt(id);

  try {
    const [companion, cidade] = await Promise.all([
      getCompanionById(companionId),
      getCompanionCityName(companionId).catch(() => null),
    ]);

    // Textos escritos à mão para alguns perfis. O título fica sem a marca: o
    // template do layout acrescenta " | OneSugar" a todos os títulos.
    const customMetadata: Record<number, { title?: string; description: string }> = {
      184: {
        description: 'Gabi Mendes, 23 anos, estudante de sociologia, é uma morena charmosa, feminina e muito atraente.',
      },
      254: {
        title: 'Sophia | Especialista em Massagem Erótica',
        description: 'Descubra a experiência de massagem erótica de Sofia em um ambiente discreto e relaxante, com atmosfera tranquila, toque sensual e uma jornada única de prazer e conexão.',
      },
      183: {
        description: 'Conheça Luisa, massagista e modelo em Braga. Uma mulher sensual que oferece momentos intensos de prazer, relaxamento e experiências inesquecíveis. Entre em contato.',
      },
    };

    // "Bianca, acompanhante em Lisboa": distingue perfis com o mesmo nome e
    // leva o distrito para o título. Sem distrito, fica só o nome.
    const tituloPadrao = cidade
      ? `${companion.name}, acompanhante ${emDistrito(cidade)}`
      : companion.name;

    const custom = customMetadata[companionId];
    const title = custom?.title ?? tituloPadrao;
    const description =
      custom?.description ||
      companion.shortDescription ||
      `Conheça ${companion.name} na OneSugar.`;

    return {
      title,
      description,
      alternates: {
        canonical: `https://www.onesugar.pt/companions/${id}`,
      },
      openGraph: {
        title: `${title} | OneSugar`,
        description,
        url: `https://www.onesugar.pt/companions/${id}`,
      },
    };
  } catch (e) {
    return {
      title: 'Acompanhante',
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

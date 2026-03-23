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
import { isUserBlocked } from '@/db/queries/companions';
import { BlockedProfileMessage } from '@/components/blocked-profile-message';
import { getCompanionById } from '@/db/queries';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const companionId = parseInt(id);

  try {
    const companion = await getCompanionById(companionId);

    const customMetadata: Record<number, { title: string; description: string }> = {
      184: {
        title: 'Gabi Mendes | Onesugar.pt',
        description: 'Gabi Mendes, 23 anos, estudante de sociologia, é uma morena charmosa, feminina e muito atraente.',
      },
      254: {
        title: 'Sophia | Especialista em Massagem Erótica by One Sugar',
        description: 'Descubra a experiência de massagem erótica de Sofia em um ambiente discreto e relaxante, com atmosfera tranquila, toque sensual e uma jornada única de prazer e conexão.',
      },
      183: {
        title: 'Luisa | One Sugar',
        description: 'Conheça Luisa, massagista e modelo em Braga. Uma mulher sensual que oferece momentos intensos de prazer, relaxamento e experiências inesquecíveis. Entre em contato.',
      },
    };

    const metadata = customMetadata[companionId] || {
      title: `${companion.name} | Onesugar`,
      description: companion.shortDescription || `Conheça ${companion.name} na Onesugar.`,
    };

    return {
      title: metadata.title,
      description: metadata.description,
      openGraph: {
        title: metadata.title,
        description: metadata.description,
        url: `https://www.onesugar.pt/companions/${id}`,
      },
    };
  } catch (e) {
    return {
      title: 'Acompanhante | Onesugar',
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

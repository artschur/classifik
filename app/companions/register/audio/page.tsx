import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCompanionNameByClerkId } from '@/db/queries/companions';
import AudioFormClient from './audio-form';
import { isVerificationPending } from '@/app/actions/document-verification';

export default async function AudioPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const [isUserVerified, companion] = await Promise.all([
    isVerificationPending(userId),
    getCompanionNameByClerkId(userId),
  ]);

  if (isUserVerified) {
    redirect('/verification/pending');
  }

  if (sessionClaims.metadata.plan !== 'vip') {
    redirect('/checkout');
  }

  if (!companion) {
    return <div>Companion not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Audio para {companion.name}</h1>

      <Suspense
        fallback={
          <div className="flex flex-col gap-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-full flex flex-row bg-neutral-200 animate-pulse rounded-md"
              ></div>
            ))}
          </div>
        }
      >
        <AudioFormClient companionId={companion.id} userId={userId} />
      </Suspense>
    </div>
  );
}

import { Suspense } from 'react';
import type { RegisterCompanionFormValues } from '@/components/formCompanionRegister';
import { getUnverifiedCompanions } from '@/db/queries/companions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import VerifyCompanionsList from '@/components/verifyCompanionsList';
import { Skeleton } from '@/components/ui/skeleton';

const authorizedIds = [`user_2s07vybL9GSrjPbhjljghGwzl1X`];

async function FetchUnverifiedCompanions() {
  const userId = (await auth()).userId;

  if (!userId) {
    throw new Error('User ID not found');
  }

  if (authorizedIds.includes(userId)) {
    const response = await getUnverifiedCompanions();
    return <VerifyCompanionsList initialCompanions={response} />;
  } else {
    redirect('/location');
  }
}

function CompanionsListSkeleton() {
  return (
    <div className="space-y-4 w-full max-w-2xl">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="w-full h-64" />
      ))}
    </div>
  );
}

export default function VerifyCompanionPage() {
  return (
    <section className="p-4 flex flex-col items-center justify-center w-full h-full space-y-4">
      <h1 className="text-3xl font-bold">Verificação de Acompanhante</h1>
      <Suspense fallback={<CompanionsListSkeleton />}>
        <FetchUnverifiedCompanions />
      </Suspense>
    </section>
  );
}

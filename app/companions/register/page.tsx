import { RegisterCompanionForm } from '@/components/formCompanionRegister';
import { SkeletonForm } from '@/components/skeletons/skeletonForm';
import { getAvailableCities } from '@/db/queries';
import {
  getCompanionByClerkId,
  getCompanionToEdit,
} from '@/db/queries/companions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

async function CompanionFormWithData({ userId }: { userId: string }) {
  const [cities, companion] = await Promise.all([
    getAvailableCities(),
    getCompanionToEdit(userId),
  ]);

  return (
    <RegisterCompanionForm
      cities={cities}
      companionData={companion} // companion will be null if not found
    />
  );
}

export default async function RegisterCompanionPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-8 md:px-0">
      <Suspense fallback={<SkeletonForm />}>
        <CompanionFormWithData userId={userId} />
      </Suspense>
    </div>
  );
}

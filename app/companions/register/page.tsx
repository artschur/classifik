import {
  isVerificationPending,
  verifyItemsIfOnboardingComplete,
} from '@/app/actions/document-verification';
import { RegisterCompanionForm } from '@/components/formCompanionRegister';
import { SkeletonForm } from '@/components/skeletons/skeletonForm';
import { getAvailableCities } from '@/db/queries';
import { getCompanionToEdit } from '@/db/queries/companions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

async function CompanionFormWithData() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect('/');
  }

  const [cities, companion, stillVerifying, allVerificationStatus] = await Promise.all([
    getAvailableCities(),
    getCompanionToEdit(userId),
    isVerificationPending(userId),
    verifyItemsIfOnboardingComplete(userId),
  ]);

  if (!allVerificationStatus.isVerificationVideoUploaded && allVerificationStatus.isImageUploaded) {
    redirect('/companions/verification');
  }

  if (stillVerifying) {
    redirect('/companions/verification/pending');
  }

  return (
    <RegisterCompanionForm
      cities={cities}
      companionData={companion} // companion will be null if not found
    />
  );
}

export default async function RegisterCompanionPage() {
  return (
    <div className="container mx-auto py-8 md:px-0">
      <Suspense fallback={<SkeletonForm />}>
        <CompanionFormWithData />
      </Suspense>
    </div>
  );
}

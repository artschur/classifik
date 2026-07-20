import {
  isVerificationPending,
  verifyItemsIfOnboardingComplete,
} from "@/app/actions/document-verification";
import { RegisterCompanionForm } from "@/components/formCompanionRegister";
import { SkeletonForm } from "@/components/skeletons/skeletonForm";
import { db } from "@/db";
import { getAvailableCities } from "@/db/queries";
import { getCompanionToEdit } from "@/db/queries/companions";
import { companionsTable } from "@/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { EarningsCalculator } from "@/components/earnings-calculator";

export const metadata: Metadata = {
  title: 'Cadastre-se agora | One Sugar',
  description: 'Join OneSugar Portugal and create your companion profile to connect with verified members seeking private and premium experiences.',
};



async function CompanionFormWithData() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-up?redirect_url=/companions/register");
  }

  const [
    cities,
    companion,
    stillVerifying,
    allVerificationStatus,
    companionVerificationStatus,
  ] = await Promise.all([
    getAvailableCities(),
    getCompanionToEdit(userId),
    isVerificationPending(userId),
    verifyItemsIfOnboardingComplete(userId),
    db
      .select({ verified: companionsTable.verified })
      .from(companionsTable)
      .where(eq(companionsTable.auth_id, userId))
      .limit(1),
  ]);

  const isVerified = companionVerificationStatus[0]?.verified ?? false;

  // Update metadata to track document upload status and ensure companion flags are set.
  // This also handles users who arrive directly (e.g. from the "Registar como Sugar" CTA)
  // without going through /onboarding — we auto-mark them as companions.
  const currentHasDocs = sessionClaims?.metadata?.hasUploadedDocs;
  const hasDocsNow = allVerificationStatus.isVerificationVideoUploaded;
  const needsOnboarding = !sessionClaims?.metadata?.onboardingComplete;

  if (currentHasDocs !== hasDocsNow || needsOnboarding) {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...sessionClaims?.metadata,
        onboardingComplete: true,
        isCompanion: true,
        isRegistrationComplete: sessionClaims?.metadata?.isRegistrationComplete ?? false,
        hasUploadedDocs: hasDocsNow,
      },
    });
  }

  // If verification is pending (has all docs uploaded), show pending page
  if (stillVerifying) {
    redirect("/companions/verification/pending");
  }

  // Only redirect to verification page if:
  // 1. User is NOT already verified
  // 2. Companion profile exists (registration completed)
  // 3. Images are uploaded (completed registration form)
  // 4. Verification video NOT uploaded yet
  if (
    !isVerified &&
    companion &&
    allVerificationStatus.isImageUploaded &&
    !allVerificationStatus.isDocumentUploaded
  ) {
    redirect("/companions/verification");
  }

  return (
    <RegisterCompanionForm
      cities={JSON.parse(JSON.stringify(cities))}
      companionData={companion ? JSON.parse(JSON.stringify(companion)) : null}
    />
  );
}

export default async function RegisterCompanionPage() {
  return (
    <div className="container mx-auto py-8 md:px-0 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Torne-se uma Sugar na Onesugar</h1>
        <p className="text-sm text-muted-foreground">Perfis verificados. Visibilidade real. 100% dos ganhos para si.</p>
      </div>
      <EarningsCalculator />
      <div id="register-form">
        <Suspense fallback={<SkeletonForm />}>
          <CompanionFormWithData />
        </Suspense>
      </div>
    </div>
  );
}

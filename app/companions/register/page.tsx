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



async function CompanionFormWithData() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/");
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

  // Update metadata to track document upload status
  const currentHasDocs = sessionClaims?.metadata?.hasUploadedDocs;
  const hasDocsNow = allVerificationStatus.isVerificationVideoUploaded;

  // Only update if the status has changed to avoid unnecessary writes
  if (currentHasDocs !== hasDocsNow) {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...sessionClaims?.metadata, // Preserve all existing metadata
        isCompanion: true,
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
    !allVerificationStatus.isVerificationVideoUploaded
  ) {
    redirect("/companions/verification");
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

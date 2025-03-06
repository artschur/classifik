import { Suspense } from 'react';
import { getUnverifiedCompanions } from '@/db/queries/companions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import VerifyCompanionsList from '@/components/verifyCompanionsList';
import { Skeleton } from '@/components/ui/skeleton';
import { RedirectToSignIn } from '@clerk/nextjs';
import { FileCheck, ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';

const authorizedIds = [
  `user_2s07vybL9GSrjPbhjljghGwzl1X`,
  'user_2sqI4uTepu0PyRSqlCYxM9ExFW8',
  'user_2sqAwSVd5g0wjbJ8ewbR7zzyUCm',
];

async function FetchUnverifiedCompanions() {
  const userId = (await auth()).userId;

  if (!userId) {
    return <RedirectToSignIn />;
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
        <Skeleton key={i} className="w-full h-[430px]" />
      ))}
    </div>
  );
}

export default function VerifyCompanionPage() {
  return (
    <section className="p-4 flex flex-col items-center justify-center w-full h-full space-y-4">
      <h1 className="text-3xl font-bold">Companion Verification</h1>

      <div className="w-full max-w-2xl space-y-4 mb-4">
        <AlertDialog
          variant="default"
          className="bg-blue-50 text-blue-800 border-blue-200"
        >
          <FileCheck className="h-4 w-4" />
          <AlertDialogTitle>Document Verification</AlertDialogTitle>
          <AlertDialogDescription>
            Each companion must provide at least one form of ID and a
            verification video to be approved. Verification videos are
            automatically deleted after approval for GDPR compliance.
          </AlertDialogDescription>
        </AlertDialog>

        <AlertDialog
          variant="default"
          className="bg-amber-50 text-amber-800 border-amber-200"
        >
          <ShieldAlert className="h-4 w-4" />
          <AlertDialogTitle>Verification Requirements</AlertDialogTitle>
          <AlertDialogDescription>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                Check that the verification video shows the companion's face
                clearly
              </li>
              <li>
                Verify that they hold a paper with their name, age, and
                "onesugar" written on it
              </li>
              <li>
                Ensure their ID document matches their profile information
              </li>
              <li>All companions must be 18+ to be verified</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialog>
      </div>

      <Suspense fallback={<CompanionsListSkeleton />}>
        <FetchUnverifiedCompanions />
      </Suspense>
    </section>
  );
}

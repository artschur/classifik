import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { companionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isVerificationPending, verifyItemsIfOnboardingComplete } from '@/app/actions/document-verification';
import { VideoVerificationForm } from '@/components/video-verification-form';

export const dynamic = 'force-dynamic';

export default async function VideoVerificationPage() {
  const { userId } = await auth();

  if (!userId) redirect('/');

  const [companion] = await db
    .select({ id: companionsTable.id })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, userId))
    .limit(1)
    .catch(() => [null]);

  if (!companion) redirect('/companions/register');

  const [isPending, uploadStatus] = await Promise.all([
    isVerificationPending(userId),
    verifyItemsIfOnboardingComplete(userId),
  ]);

  if (isPending) redirect('/companions/verification/pending');

  // If video already uploaded, go straight to document step
  if (uploadStatus.isVerificationVideoUploaded && !uploadStatus.isDocumentUploaded) {
    redirect('/companions/verification/document');
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10 text-sm font-semibold text-muted-foreground">
        <span className="bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
        <span className="text-foreground">Vídeo de Verificação</span>
        <span className="mx-2">→</span>
        <span className="bg-muted rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
        <span>Documento de Identificação</span>
      </div>

      <VideoVerificationForm initialVideoUploaded={uploadStatus.isVerificationVideoUploaded} />
    </div>
  );
}

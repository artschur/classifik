import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { companionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isVerificationPending, verifyItemsIfOnboardingComplete } from '@/app/actions/document-verification';
import { DocumentUploadForm } from '@/components/document-upload-form';

export const dynamic = 'force-dynamic';

export default async function DocumentVerificationPage() {
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

  // Must upload video first
  if (!uploadStatus.isVerificationVideoUploaded) {
    redirect('/companions/verification');
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10 text-sm font-semibold text-muted-foreground">
        <span className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
        <span className="line-through">Vídeo de Verificação</span>
        <span className="mx-2">→</span>
        <span className="bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
        <span className="text-foreground">Documento de Identificação</span>
      </div>

      <DocumentUploadForm />
    </div>
  );
}

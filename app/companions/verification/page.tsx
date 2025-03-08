import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DocumentVerificationForm } from '@/components/documentVerificationForm';
import { getCompanionByClerkId } from '@/db/queries/companions';
import {
  isCompanionVerified,
  isVerificationPending,
} from '@/app/actions/document-verification';

export const dynamic = 'force-dynamic';

export default async function DocumentVerificationPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  try {
    const companion = await getCompanionByClerkId(userId);
    if (!companion) {
      redirect('/companions/register');
    }
  } catch (error) {
    // If there's an error or companion not found, redirect to register
    redirect('/companions/register');
  }

  const isPendingVerification: boolean = await isVerificationPending(userId);

  if (isPendingVerification) {
    redirect('/companions/verification/pending');
  }

  const isCompleteVerification: boolean = await isCompanionVerified(userId);

  if (isCompleteVerification) {
    redirect('/companions/verification/success');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Verificação de Documentos</h1>
      <p className="text-muted-foreground mb-8">
        Para verificar sua conta, faça o upload dos documentos necessários. Sua
        conta estará disponível assim que nossa equipe revisar seus documentos.
      </p>
      <DocumentVerificationForm />
    </div>
  );
}

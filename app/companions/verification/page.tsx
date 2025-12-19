import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DocumentVerificationForm } from '@/components/documentVerificationForm';
import { getCompanionByClerkId } from '@/db/queries/companions';
import { isVerificationPending, verifyItemsIfOnboardingComplete } from '@/app/actions/document-verification';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

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

  // Get verification status and uploaded items
  const [isPendingVerification, uploadStatus] = await Promise.all([
    isVerificationPending(userId),
    verifyItemsIfOnboardingComplete(userId),
  ]);

  if (isPendingVerification) {
    redirect('/companions/verification/pending');
  }

  const allDocsUploaded = uploadStatus.isVerificationVideoUploaded && uploadStatus.isDocumentUploaded;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Verificação de Documentos</h1>
      <p className="text-muted-foreground mb-6">
        Envie os documentos necessários para verificar sua conta. A verificação será concluída após a análise.
      </p>

      {/* Status Card */}
      <div className="bg-card border rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-3">Status da Verificação</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {uploadStatus.isVerificationVideoUploaded ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />
                )}
                <span className={uploadStatus.isVerificationVideoUploaded ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                  Vídeo de Verificação {uploadStatus.isVerificationVideoUploaded ? '✓' : '(Pendente)'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {uploadStatus.isDocumentUploaded ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />
                )}
                <span className={uploadStatus.isDocumentUploaded ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                  Documento de Identidade {uploadStatus.isDocumentUploaded ? '✓' : '(Pendente)'}
                </span>
              </div>
            </div>
            <div className={`mt-4 pt-4 border-t ${allDocsUploaded ? 'bg-green-50 -m-6 p-6 rounded-b-lg' : ''}`}>
              <p className={`text-sm font-medium ${allDocsUploaded ? 'text-green-800' : 'text-orange-600'}`}>
                {allDocsUploaded
                  ? '✓ Todos os documentos enviados! Nossa equipe está verificando suas informações. Você será notificado assim que a verificação for concluída.'
                  : '⚠️ Importante: Você precisa enviar AMBOS os itens acima para prosseguir com a verificação.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <DocumentVerificationForm uploadStatus={uploadStatus} />
    </div>
  );
}

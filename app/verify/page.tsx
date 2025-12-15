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
import { isAdmin } from '@/components/header';

async function FetchUnverifiedCompanions() {
  const userId = (await auth()).userId;
  if (!userId) {
    return <RedirectToSignIn />;
  }

  if (isAdmin(userId)) {
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
        <AlertDialog>
          <FileCheck className="h-4 w-4" />
          <AlertDialogTitle>Verificação de Documentos</AlertDialogTitle>
          <AlertDialogDescription>
            Cada sugar precisa mandar um documento e um vídeo de verificação para entrar na
            plataforma.
          </AlertDialogDescription>
        </AlertDialog>

        <AlertDialog>
          <ShieldAlert className="h-4 w-4" />
          <AlertDialogTitle>Requisitos de Verificação</AlertDialogTitle>
          <AlertDialogDescription>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Verifique se o vídeo de verificação mostra claramente o rosto do sugar</li>
              <li>Verifique se eles seguram um papel com a data e "onesugar" escrito nele</li>
              <li>Garanta que o documento de identificação corresponde às informações do perfil</li>
              <li>Todos os sugars devem ter 18+ anos para serem verificados</li>
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

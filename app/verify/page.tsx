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
  'user_2tulS8cCaz8h2jmcWSRmak5gcSX',
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
        <AlertDialog>
          <FileCheck className="h-4 w-4" />
          <AlertDialogTitle>Verificação de Documentos</AlertDialogTitle>
          <AlertDialogDescription>
            Cada acompanhante precisa mandar um documento e um vídeo de
            verificação para entrar na plataforma.
          </AlertDialogDescription>
        </AlertDialog>

        <AlertDialog>
          <ShieldAlert className="h-4 w-4" />
          <AlertDialogTitle>Requisitos de Verificação</AlertDialogTitle>
          <AlertDialogDescription>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                Verifique se o vídeo de verificação mostra claramente o rosto do
                acompanhante
              </li>
              <li>
                Verifique se eles seguram um papel com seu nome, idade e
                "onesugar" escrito nele
              </li>
              <li>
                Garanta que o documento de identificação corresponde às
                informações do perfil
              </li>
              <li>
                Todos os acompanhantes devem ter 18+ anos para serem verificados
              </li>
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

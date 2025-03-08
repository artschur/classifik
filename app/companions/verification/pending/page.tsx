import { Button } from '@/components/ui/button';
import {
  getCompanionByClerkId,
  getCompanionNameByClerkId,
} from '@/db/queries/companions';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { Suspense } from 'react';

async function getCompanionName() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { name } = await getCompanionNameByClerkId(userId);

  if (!name) {
    throw new Error('Companion not found');
  }
  return name;
}

async function CompanionGreeting() {
  const name = await getCompanionName();
  return <span className="">{name}</span>;
}

export default function PendingVerificationPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="flex flex-col items-start">
        <h1 className="text-3xl">
          Olá <br />
          <Suspense
            fallback={
              <div className="h-8 w-48 bg-stone-600 rounded-lg animate-pulse"></div>
            }
          >
            <CompanionGreeting />!
          </Suspense>
        </h1>
        <h1 className="text-xl pt-4">
          Sua conta foi está em{' '}
          <span className="text-yellow-500"> processo de verificação.</span>
        </h1>
        <p className="text-muted-foreground max-w-[400px] pt-2">
          Mas fique calmo, nossa equipe está verificando seus documentos para
          deixar nossa plataforma mais segura.
        </p>
        <Link href="/">
          <Button
            variant="default"
            className="mt-4 bg-yellow-500 hover:bg-yellow-700"
          >
            Voltar
          </Button>
        </Link>
      </div>
    </div>
  );
}

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
  return { name };
}

export async function CompanionGreeting() {
  const { name } = await getCompanionName();
  return <span className="">{name}</span>;
}

export default function SucessfulVerificationPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="flex flex-col items-start">
        <h1 className="text-3xl">
          Parabéns <br />
          <Suspense
            fallback={
              <div className="h-8 w-48 bg-stone-600 rounded-lg animate-pulse"></div>
            }
          >
            <CompanionGreeting />!
          </Suspense>
        </h1>
        <h1 className="text-xl pt-4">
          Sua conta foi verificada com
          <span className="text-green-500"> sucesso.</span>
        </h1>
        <p className="text-muted-foreground max-w-[400px] pt-2">
          Agora você pode vizualizar suas estatísticas e aparecer para clientes
          ao redor do mundo 🌎
        </p>
        <Link href={`/profile`}>
          <Button
            variant="default"
            className="mt-4 bg-green-500 text-green-900 hover:bg-green-800 hover:text-green-200"
          >
            Visualizar seu perfil
          </Button>
        </Link>
      </div>
    </div>
  );
}

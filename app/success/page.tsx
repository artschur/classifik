import { db, kv } from '@/db';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

export default async function Success() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return <div className="text-red-500">Usuário não autenticado.</div>;
  }

  if (sessionClaims.plan === 'free') {
    return <div className="text-red-500">Acesso negado. Assinatura pagamento necessario.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Pagamento realizado com sucesso.</h1>
        <p className="text-lg">Obrigado por sua compra.</p>
        <p className="text-gray-600">
          Você já tem acesso imediato de seus benefícios. Contate nosso suporte caso precise de
          ajuda!
        </p>

        <div className="mt-8">
          {sessionClaims.metadata.plan === 'vip' && (
            <div className="w-full min-h-full">
              <Link className="p-2 bg-neutral-800 rounded-lg" href="/companions/register/audio">
                Registre seu Audio aqui
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

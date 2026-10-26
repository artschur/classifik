import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getCompanionNameByClerkId } from '@/db/queries/companions';
import { EstadoRegisto } from '@/components/registo/estado-registo';

export const dynamic = 'force-dynamic';

/**
 * Fim do registo: o perfil está na fila do admin. Mostra o que ainda falta
 * (verificação, características) com o caminho para cada coisa.
 */
export default async function PendingVerificationPage() {
  // A entrada é a página do Clerk: /sign-in não existe no site.
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const companion = await getCompanionNameByClerkId(userId).catch(() => null);
  if (!companion) redirect('/companions/register');

  return (
    <div className="container mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Obrigado, {companion.name.trim()}!</h1>
        <p className="text-muted-foreground">
          O seu perfil foi enviado para a nossa equipa. Avisamos assim que for
          aprovado.
        </p>
      </div>

      <EstadoRegisto clerkId={userId} contexto="final" />

      <Button asChild>
        <Link href="/profile">Ir para o meu painel</Link>
      </Button>
    </div>
  );
}

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCompanionIdByClerkId, getBlockedUsers } from '@/db/queries/companions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, X } from 'lucide-react';
import Link from 'next/link';
import { unblockUserAction } from '@/app/actions/block-actions';
import { PlanType } from '@/db/queries/kv';

/**
 * Bloqueios da anunciante.
 *
 * Esta página listava os primeiros 100 utilizadores do Clerk, com nome e
 * email, para a anunciante escolher quem bloquear. Isso mostrava a qualquer
 * VIP os emails dos clientes e das outras anunciantes, e nem servia o
 * propósito: o contacto é por WhatsApp, e nada naquela lista dizia quem era
 * o cliente em causa. Fica só a lista de quem já está bloqueado.
 */
export default async function BlockPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  if (!sessionClaims?.metadata?.isCompanion) {
    console.log('User is not a companion, redirecting to onboarding');
    redirect('/onboarding');
  }

  if (sessionClaims?.metadata?.plan !== PlanType.VIP) {
    redirect('/checkout');
  }

  try {
    const companionId = await getCompanionIdByClerkId(userId);
    const blockedUsers = await getBlockedUsers(companionId);

    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Gerenciar Usuários Bloqueados
          </h1>
          <p className="text-muted-foreground mt-2">
            Usuários bloqueados não conseguem ver o seu perfil.
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <X className="w-5 h-5" />
                Usuários Bloqueados ({blockedUsers.length})
              </CardTitle>
              <CardDescription>
                Lista dos usuários que você bloqueou de ver o seu perfil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Você ainda não bloqueou nenhum usuário.
                </p>
              ) : (
                <div className="space-y-4">
                  {blockedUsers.map((blockedUser: any) => (
                    <div
                      key={blockedUser.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{blockedUser.blocked_user_id}</p>
                        {blockedUser.reason && (
                          <p className="text-sm text-muted-foreground">
                            Motivo: {blockedUser.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Bloqueado em:{' '}
                          {blockedUser.created_at
                            ? new Date(blockedUser.created_at).toLocaleDateString('pt-BR')
                            : 'Data desconhecida'}
                        </p>
                      </div>
                      <form
                        action={async () => {
                          'use server';
                          await unblockUserAction(companionId, blockedUser.blocked_user_id);
                        }}
                      >
                        <Button variant="outline" size="sm" type="submit">
                          Desbloquear
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-center">
            <Link href="/profile">
              <Button variant="outline">Voltar ao Perfil</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading block page:', error);
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-red-500">Erro ao carregar a página de bloqueio.</p>
        <Link href="/profile">
          <Button className="mt-4">Voltar ao Perfil</Button>
        </Link>
      </div>
    );
  }
}

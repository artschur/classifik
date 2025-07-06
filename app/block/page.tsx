import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  getCompanionIdByClerkId,
  getBlockedUsers,
} from '@/db/queries/companions';
import { BlockManagementForm } from '@/components/block-management-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, X, User, Mail, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { unblockUserAction } from '@/app/actions/block-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlanType } from '@/db/queries/kv';

export default async function BlockPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  console.log('Session claims:', sessionClaims);
  console.log('Metadata:', sessionClaims?.metadata);
  console.log('isCompanion:', sessionClaims?.metadata?.isCompanion);

  if (!sessionClaims?.metadata?.isCompanion) {
    console.log('User is not a companion, redirecting to onboarding');
    redirect('/onboarding');
  }

  if (sessionClaims?.metadata?.plan !== PlanType.VIP) {
    console.log('User does not have VIP plan, redirecting to profile');
    redirect('/checkout');
  }

  try {
    const companionId = await getCompanionIdByClerkId(userId);
    const clerk = await clerkClient();
    const [blockedUsers, clerkResponse] = await Promise.all([
      getBlockedUsers(companionId),
      clerk.users.getUserList({ limit: 100 }),
    ]);

    const clerkUsers = clerkResponse.data || [];

    // Create a set of blocked user IDs for quick lookup
    const blockedUserIds = new Set(
      blockedUsers.map((user) => user.blocked_user_id)
    );

    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Gerenciar Usuários Bloqueados
          </h1>
          <p className="text-muted-foreground mt-2">
            Bloqueie usuários que você não quer que vejam seu perfil.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Lista de Usuários ({clerkUsers.length})
              </CardTitle>
              <CardDescription>
                Todos os usuários registrados no sistema. Clique em "Bloquear"
                para impedir que vejam seu perfil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clerkUsers.map((user: any) => {
                      const isBlocked = blockedUserIds.has(user.id);
                      const isCurrentUser = user.id === userId;

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="min-w-[250px]">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={user.imageUrl}
                                  alt={
                                    user.username || user.firstName || 'User'
                                  }
                                />
                                <AvatarFallback>
                                  {user.firstName?.[0] ||
                                    user.username?.[0] ||
                                    'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.username || 'Usuário sem nome'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {user.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {user.emailAddresses?.[0]?.emailAddress ||
                                  'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isCurrentUser ? (
                              <Badge variant="secondary">Você</Badge>
                            ) : isBlocked ? (
                              <Badge variant="destructive">Bloqueado</Badge>
                            ) : (
                              <Badge variant="outline">Ativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isCurrentUser ? (
                              <Button variant="ghost" size="sm" disabled>
                                N/A
                              </Button>
                            ) : isBlocked ? (
                              <form
                                action={async () => {
                                  'use server';
                                  await unblockUserAction(companionId, user.id);
                                }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="submit"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Desbloquear
                                </Button>
                              </form>
                            ) : (
                              <form
                                action={async () => {
                                  'use server';
                                  await import(
                                    '@/app/actions/block-actions'
                                  ).then(({ blockUserAction }) =>
                                    blockUserAction(companionId, user.id)
                                  );
                                }}
                              >
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  type="submit"
                                >
                                  <ShieldAlert className="w-4 h-4 mr-1" />
                                  Bloquear
                                </Button>
                              </form>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {clerkUsers.map((user: any) => {
                  const isBlocked = blockedUserIds.has(user.id);
                  const isCurrentUser = user.id === userId;

                  return (
                    <div
                      key={user.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={user.imageUrl}
                            alt={user.username || user.firstName || 'User'}
                          />
                          <AvatarFallback>
                            {user.firstName?.[0] || user.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username || 'Usuário sem nome'}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {user.emailAddresses?.[0]?.emailAddress || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {isCurrentUser ? (
                            <Badge variant="secondary">Você</Badge>
                          ) : isBlocked ? (
                            <Badge variant="destructive">Bloqueado</Badge>
                          ) : (
                            <Badge variant="outline">Ativo</Badge>
                          )}
                        </div>

                        <div>
                          {isCurrentUser ? (
                            <Button variant="ghost" size="sm" disabled>
                              N/A
                            </Button>
                          ) : isBlocked ? (
                            <form
                              action={async () => {
                                'use server';
                                await unblockUserAction(companionId, user.id);
                              }}
                            >
                              <Button variant="outline" size="sm" type="submit">
                                <X className="w-4 h-4 mr-1" />
                                Desbloquear
                              </Button>
                            </form>
                          ) : (
                            <form
                              action={async () => {
                                'use server';
                                await import(
                                  '@/app/actions/block-actions'
                                ).then(({ blockUserAction }) =>
                                  blockUserAction(companionId, user.id)
                                );
                              }}
                            >
                              <Button
                                variant="destructive"
                                size="sm"
                                type="submit"
                              >
                                <ShieldAlert className="w-4 h-4 mr-1" />
                                Bloquear
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Blocked Users Summary */}
          {blockedUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <X className="w-5 h-5" />
                  Usuários Bloqueados ({blockedUsers.length})
                </CardTitle>
                <CardDescription>
                  Lista detalhada de usuários que você bloqueou de ver seu
                  perfil.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blockedUsers.map((blockedUser: any) => (
                    <div
                      key={blockedUser.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {blockedUser.blocked_user_id}
                        </p>
                        {blockedUser.reason && (
                          <p className="text-sm text-muted-foreground">
                            Motivo: {blockedUser.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Bloqueado em:{' '}
                          {blockedUser.created_at
                            ? new Date(
                                blockedUser.created_at
                              ).toLocaleDateString('pt-BR')
                            : 'Data desconhecida'}
                        </p>
                      </div>
                      <form
                        action={async () => {
                          'use server';
                          await unblockUserAction(
                            companionId,
                            blockedUser.blocked_user_id
                          );
                        }}
                      >
                        <Button variant="outline" size="sm" type="submit">
                          Desbloquear
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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

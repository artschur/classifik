import 'server-only';

import { getUserPlan } from '@/db/queries/plan';

/**
 * Quem pode gravar o áudio do perfil: anunciantes com VIP activo.
 *
 * Lê o plano da base (subscrição activa ou compra ainda válida) e não da
 * sessão do Clerk, que só muda quando chega um webhook da Stripe e pode ficar
 * a dizer VIP depois de o plano expirar. É a mesma regra para o botão no
 * perfil, para a página de gravação e para o envio.
 */
export async function canRecordAudio(clerkId: string): Promise<boolean> {
  return (await getUserPlan(clerkId)) === 'vip';
}

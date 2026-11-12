// Último acesso de uma anunciante, mostrado no perfil dela.
//
// Não é 'use server' de propósito: em db/queries/userActions.ts ficava
// chamável pelo navegador com o id de qualquer conta (clientes incluídos).
// Aqui só o servidor a chama, com o id do perfil que está a mostrar.
import { clerkClient } from '@clerk/nextjs/server';

export async function getLastSignInByClerkId(clerkId: string) {
  const user = await clerkClient();
  try {
    const lastSignIn = (await user.users.getUser(clerkId)).lastSignInAt;
    const getRelativeTime = (timestamp: number) => {
      const msPerHour = 1000 * 60 * 60;
      const elapsed = new Date().getTime() - timestamp;
      const hours = Math.floor(elapsed / msPerHour);

      if (hours < 1) {
        return 'há menos de uma hora';
      }
      if (hours < 24) {
        return hours === 1 ? 'há 1 hora' : `há ${hours} horas`;
      }
      const days = Math.floor(hours / 24);
      return days === 1 ? 'há 1 dia' : `há ${days} dias`;
    };
    if (!lastSignIn) {
      return 'Nunca';
    }
    return getRelativeTime(lastSignIn);
  } catch {
    return 'Never';
  }
}

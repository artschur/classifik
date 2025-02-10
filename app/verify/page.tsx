import { RegisterCompanionFormValues } from '@/components/formCompanionRegister';
import SingleCompanionComponent from '@/components/singleCompanion';
import SingleCompanionVerify from '@/components/singleComponentVerify';
import { getUnverifiedCompanions } from '@/db/queries/companions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const authorizedIds = [`user_2s07vybL9GSrjPbhjljghGwzl1X`];

async function fetchUnverifiedCompanions() {
  const userId = (await auth()).userId;

  if (!userId) {
    throw new Error('User ID not found');
  }

  if (authorizedIds.includes(userId)) {
    const response = await getUnverifiedCompanions();
    console.log(response);
    return response ?? [];
  } else {
    redirect('/location');
  }
}

export default async function verifyCompanionPage() {
  const companions: (RegisterCompanionFormValues & { id: number })[] =
    (await fetchUnverifiedCompanions()) ?? [];

  return (
    <section className="p-4 flex flex-col items-center justify-center w-full h-full space-y-4">
      <h1 className="text-3xl font-bold">Verificação de Acompanhante</h1>
      <p className="text-lg text-center">
        Aqui apareceram as acompanhantes que devem passar por aprovação da
        plataforma. Você pode aprovar ou rejeitar a solicitação.
      </p>
      <div className="flex flex-col w-full space-y-4">
        {companions.map(
          (companion: RegisterCompanionFormValues & { id: number }) => (
            <SingleCompanionVerify
              companion={companion}
              key={companion.id}
            />
          )
        )}
      </div>
    </section>
  );
}

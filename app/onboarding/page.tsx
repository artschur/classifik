import { Spotlight } from '@/components/spotlightNew';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { handleOnboard } from './actions';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isUserACompanion } from '@/db/queries/companions';

export default async function OnboardPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return redirect('/sign-in');
  }

  const clerk = await clerkClient();

  const isCompanion = await isUserACompanion(userId);
  if (isCompanion) {
    await auth().then(async ({ userId }) => {
      if (userId) {
        await clerk.users.updateUserMetadata(userId, {
          publicMetadata: {
            isCompanion: true,
            onboardingComplete: true,
          },
        });
      }
    });
    return redirect('/profile');
  }

  if (sessionClaims?.metadata.onboardingComplete) {
    // If the user has already completed onboarding, redirect them to the appropriate page
    const isCompanion = sessionClaims.metadata.isCompanion;
    if (isCompanion) {
      return redirect('/companions/register');
    } else {
      return redirect('/location');
    }
  }

  return (
    <section className="w-full min-h-screen flex items-center justify-center p-12">
      <Spotlight />
      <div className="max-w-7xl flex items-center justify-center h-full flex-col w-full pt-20 md:pt-0">
        <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
          Bem vindo ao <br /> OneSugar
        </h1>
        <p className="mt-4 font-normal text-base text-neutral-300 max-w-lg text-center mx-auto">
          as mais doces sugars de portugal, em um só lugar.
        </p>
        <div className="flex gap-4 mt-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <form action={handleOnboard}>
                <input type="hidden" name="isCompanion" value="true" />
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary/80 rounded-lg hover:bg-white/20 transition-all"
                >
                  Sou Sugar
                </button>
              </form>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Divulgar na OneSugar.</h4>
                <ul className="text-sm list-disc pl-4 space-y-1">
                  <li>Aumente sua visibilidade</li>
                  <li>Gerencie seu perfil facilmente</li>
                  <li>Adquira novos clientes em uma plataforma crescente.</li>
                </ul>
              </div>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <form action={handleOnboard}>
                <input type="hidden" name="isCompanion" value="false" />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                >
                  Sou Cliente
                </button>
              </form>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Ser um cliente OneSugar.</h4>
                <ul className="text-sm list-disc pl-4 space-y-1">
                  <li>Tenha acesso a mais perfis.</li>
                  <li>Leie e deixe reviews</li>
                  <li>Anonimidade em primeiro lugar</li>
                  <li>Segurança em primeiro lugar</li>
                </ul>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <p className="text-neutral-300 text-sm mt-4">Crie sua conta gratuitamente</p>
      </div>
    </section>
  );
}

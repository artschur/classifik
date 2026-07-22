import { Spotlight } from "@/components/spotlightNew";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { handleOnboard } from "./actions";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isUserACompanion } from "@/db/queries/companions";
import { EarningsCalculator } from "@/components/earnings-calculator";

export default async function OnboardPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const clerk = await clerkClient();

  const isCompanion = await isUserACompanion(userId);
  if (isCompanion) {
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...sessionClaims?.metadata,
        isCompanion: true,
        onboardingComplete: true,
        hasUploadedDocs: sessionClaims?.metadata?.hasUploadedDocs ?? false,
      },
    });
    return redirect("/profile");
  }

  if (sessionClaims?.metadata?.onboardingComplete) {
    const isCompanion = sessionClaims.metadata.isCompanion;
    if (isCompanion) {
      if (sessionClaims.metadata?.hasUploadedDocs === false) {
        return redirect("/companions/verification");
      }
      return redirect("/companions/register");
    } else {
      return redirect("/location");
    }
  }

  return (
    <section className="w-full min-h-screen flex items-center justify-center p-6 md:p-12">
      <Spotlight />
      <div className="w-full max-w-lg flex flex-col items-center gap-8 pt-16 md:pt-0">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            Bem vindo ao <br /> OneSugar
          </h1>
          <p className="mt-3 text-base text-neutral-300">
            as mais doces sugars de portugal, em um só lugar.
          </p>
        </div>

        <EarningsCalculator
          cta={
            <form action={handleOnboard} className="w-full">
              <input type="hidden" name="isCompanion" value="true" />
              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Criar o meu perfil de Sugar gratuitamente
              </button>
            </form>
          }
        />

        <form action={handleOnboard} className="w-full max-w-sm">
          <input type="hidden" name="isCompanion" value="false" />
          <button
            type="submit"
            className="w-full border border-white/20 hover:border-white/50 text-white font-semibold py-3 rounded-xl transition-colors text-sm bg-white/5 hover:bg-white/10"
          >
            Registar como Cliente gratuitamente
          </button>
        </form>
      </div>
    </section>
  );
}

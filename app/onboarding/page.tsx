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
import { getLocale } from "@/lib/locale.server";
import { localizeHref } from "@/lib/i18n";

const TEXT = {
  pt: {
    bemVindo: "Bem vindo ao",
    subtitulo: "as mais doces sugars de portugal, em um só lugar.",
    sugar: "Criar o meu perfil de Sugar gratuitamente",
    cliente: "Registar como Cliente gratuitamente",
  },
  en: {
    bemVindo: "Welcome to",
    subtitulo: "the sweetest Sugars in Portugal, all in one place.",
    sugar: "Create my Sugar profile for free",
    cliente: "Sign up as a client for free",
  },
} as const;

export default async function OnboardPage() {
  const locale = await getLocale();
  const t = TEXT[locale];
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // A entrada é a página do Clerk: /sign-in não existe no site.
  if (!userId) {
    return redirectToSignIn();
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
    return redirect(localizeHref("/profile", locale));
  }

  // Ainda sem perfil: segue para o formulário. A verificação vem depois do
  // perfil criado e pode ficar para mais tarde.
  if (sessionClaims?.metadata?.onboardingComplete) {
    return redirect(
      localizeHref(sessionClaims.metadata.isCompanion ? "/companions/register" : "/location", locale),
    );
  }

  return (
    <section className="w-full min-h-screen flex items-center justify-center p-6 md:p-12">
      <Spotlight />
      <div className="w-full max-w-lg flex flex-col items-center gap-8 pt-16 md:pt-0">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            {t.bemVindo} <br /> OneSugar
          </h1>
          <p className="mt-3 text-base text-neutral-300">
            {t.subtitulo}
          </p>
        </div>

        <form action={handleOnboard} className="w-full max-w-sm">
          <input type="hidden" name="isCompanion" value="true" />
          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {t.sugar}
          </button>
        </form>

        <form action={handleOnboard} className="w-full max-w-sm -mt-4">
          <input type="hidden" name="isCompanion" value="false" />
          <button
            type="submit"
            className="w-full border border-white/20 hover:border-white/50 text-white font-semibold py-3 rounded-xl transition-colors text-sm bg-white/5 hover:bg-white/10"
          >
            {t.cliente}
          </button>
        </form>
      </div>
    </section>
  );
}

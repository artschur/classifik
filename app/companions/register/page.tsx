import { RegisterCompanionForm } from "@/components/formCompanionRegister";
import { SkeletonForm } from "@/components/skeletons/skeletonForm";
import { EstadoRegisto } from "@/components/registo/estado-registo";
import { getAvailableCities } from "@/db/queries";
import { getCompanionToEdit } from "@/db/queries/companions";
import { getUserPlan } from "@/db/queries/plan";
import { acessoAPlanos } from "@/db/queries/verificacao";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { after } from "next/server";
import { Suspense } from "react";
import { marcarRegistoIniciado } from "@/lib/rd-station";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale.server";
import type { Locale } from "@/lib/i18n";

const TEXT = {
  pt: {
    titulo: 'Registe-se como anunciante',
    oSeuPerfil: "O seu perfil",
    torneSe: "Torne-se uma Sugar na Onesugar",
    subtitulo: "Perfis verificados. Visibilidade real. 100% dos ganhos para si.",
  },
  en: {
    titulo: 'Sign up as an advertiser',
    oSeuPerfil: "Your profile",
    torneSe: "Become a companion on Onesugar",
    subtitulo: "Verified profiles. Real visibility. You keep 100% of what you earn.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: TEXT[locale].titulo,
    description: 'Join OneSugar Portugal and create your companion profile to connect with verified members seeking private and premium experiences.',
  };
}



/** Valores trazidos da calculadora pública, para não pedir duas vezes o mesmo. */
type Prefill = { phoneNumber?: string; price?: number };

async function CompanionFormWithData({ prefill, locale }: { prefill?: Prefill; locale: Locale }) {
  const t = TEXT[locale];
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Não há /sign-up nem /sign-in no site (as páginas de entrada são as do
  // Clerk), e mandar para lá dava 404. A página de entrada do Clerk tem a
  // opção de criar conta e volta a esta página no fim.
  if (!userId) {
    return redirectToSignIn();
  }

  const [cities, companion, userPlan, acesso] = await Promise.all([
    getAvailableCities(),
    getCompanionToEdit(userId),
    getUserPlan(userId),
    acessoAPlanos(userId),
  ]);

  const maxPhotos = ['classic', 'plus', 'vip'].includes(userPlan) ? 30 : 10;

  // Quem chega aqui directamente (por exemplo, pelo "Registar como Sugar")
  // sem passar por /onboarding fica marcada como anunciante. E quem já tem
  // perfil tem o registo de base feito: sem esta marca, o proxy prendia-a
  // neste formulário em todas as páginas (contas criadas antes de a marca
  // passar a ser gravada na criação do perfil).
  const metadata = sessionClaims?.metadata;
  const registoFeito = companion ? true : (metadata?.isRegistrationComplete ?? false);
  if (
    !metadata?.onboardingComplete ||
    metadata?.isCompanion !== true ||
    metadata?.isRegistrationComplete !== registoFeito
  ) {
    const client = await clerkClient();
    // Era cliente (ou ainda não tinha escolhido) e passa a anunciar: o RD tem
    // de saber, como sabe de quem escolhe "sou sugar". Lido do Clerk e não da
    // sessão, que só acompanha a alteração no pedido seguinte e faria o
    // evento repetir-se.
    const user = companion ? null : await client.users.getUser(userId);
    const passaASugar = user !== null && user.publicMetadata?.isCompanion !== true;

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingComplete: true,
        isCompanion: true,
        isRegistrationComplete: registoFeito,
      },
    });

    const email = user?.emailAddresses[0]?.emailAddress;
    const nome = user?.fullName ?? undefined;
    if (passaASugar && email) {
      after(() => marcarRegistoIniciado(email, nome));
    }
  }

  return (
    <>
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold">
          {companion ? t.oSeuPerfil : t.torneSe}
        </h1>
        {!companion && (
          <p className="text-sm text-muted-foreground">{t.subtitulo}</p>
        )}
      </div>
      {companion && (
        <div className="px-4">
          <EstadoRegisto clerkId={userId} contexto="edicao" />
        </div>
      )}
      <RegisterCompanionForm
        cities={JSON.parse(JSON.stringify(cities))}
        companionData={companion ? JSON.parse(JSON.stringify(companion)) : null}
        maxPhotos={maxPhotos}
        prefill={prefill}
        planosDisponiveis={acesso === "pode"}
      />
    </>
  );
}

export default async function RegisterCompanionPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; price?: number | string }>;
}) {
  const { phone, price } = await searchParams;
  const locale = await getLocale();
  const parsedPrice = Number(price);

  const prefill: Prefill = {
    phoneNumber: phone?.trim() || undefined,
    price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : undefined,
  };

  return (
    <div className="container mx-auto py-8 md:px-0">
      <div id="register-form">
        <Suspense fallback={<SkeletonForm />}>
          <CompanionFormWithData prefill={prefill} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}

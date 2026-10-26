import { RegisterCompanionForm } from "@/components/formCompanionRegister";
import { SkeletonForm } from "@/components/skeletons/skeletonForm";
import { EstadoRegisto } from "@/components/registo/estado-registo";
import { getAvailableCities } from "@/db/queries";
import { getCompanionToEdit } from "@/db/queries/companions";
import { getUserPlan } from "@/db/queries/plan";
import { acessoAPlanos } from "@/db/queries/verificacao";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Registe-se como anunciante',
  description: 'Join OneSugar Portugal and create your companion profile to connect with verified members seeking private and premium experiences.',
};



/** Valores trazidos da calculadora pública, para não pedir duas vezes o mesmo. */
type Prefill = { phoneNumber?: string; price?: number };

async function CompanionFormWithData({ prefill }: { prefill?: Prefill }) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-up?redirect_url=/companions/register");
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
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingComplete: true,
        isCompanion: true,
        isRegistrationComplete: registoFeito,
      },
    });
  }

  return (
    <>
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold">
          {companion ? "O seu perfil" : "Torne-se uma Sugar na Onesugar"}
        </h1>
        {!companion && (
          <p className="text-sm text-muted-foreground">Perfis verificados. Visibilidade real. 100% dos ganhos para si.</p>
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
  const parsedPrice = Number(price);

  const prefill: Prefill = {
    phoneNumber: phone?.trim() || undefined,
    price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : undefined,
  };

  return (
    <div className="container mx-auto py-8 md:px-0">
      <div id="register-form">
        <Suspense fallback={<SkeletonForm />}>
          <CompanionFormWithData prefill={prefill} />
        </Suspense>
      </div>
    </div>
  );
}

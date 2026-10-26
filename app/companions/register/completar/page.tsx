import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCompanionToEdit } from '@/db/queries/companions';
import { PassosRegisto } from '@/components/registo/passos-registo';
import { CompletarPerfilForm } from '@/components/registo/completar-perfil-form';
import type { CompletarPerfilInput } from '@/lib/registo-schema';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Complete o seu perfil',
  robots: { index: false, follow: false },
};

/**
 * Passo 5 do registo: descrição curta, Instagram, identidade de género,
 * línguas e características. É também para onde leva o aviso "Finalize o seu
 * registo" do painel.
 */
export default async function CompletarPerfilPage() {
  // A entrada é a página do Clerk: /sign-in não existe no site.
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  // Já com a edição pendente por cima, se houver: é o que ela escreveu por último.
  const atual = await getCompanionToEdit(userId);
  if (!atual) redirect('/companions/register');

  const valoresIniciais: CompletarPerfilInput = {
    shortDescription: atual.shortDescription ?? '',
    instagramHandle: atual.instagramHandle ?? '',
    gender_identity: atual.gender_identity ?? '',
    languages: atual.languages?.length ? atual.languages : ['Português'],
    weight: atual.weight,
    height: atual.height,
    ethnicity: atual.ethnicity ?? '',
    eye_color: atual.eye_color ?? '',
    hair_color: atual.hair_color ?? '',
    hair_length: atual.hair_length ?? '',
    shoe_size: atual.shoe_size,
    silicone: atual.silicone ?? false,
    tattoos: atual.tattoos ?? false,
    piercings: atual.piercings ?? false,
    smoker: atual.smoker ?? false,
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <PassosRegisto atual={5} />
      <CompletarPerfilForm valoresIniciais={valoresIniciais} />
    </div>
  );
}

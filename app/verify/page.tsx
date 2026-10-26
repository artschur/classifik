import { Suspense } from 'react';
import { getRejectedCompanions, getUnverifiedCompanions } from '@/db/queries/companions';
import { RejectedCompanions } from '@/components/rejected-companions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import VerifyCompanionsList from '@/components/verifyCompanionsList';
import { Skeleton } from '@/components/ui/skeleton';
import { RedirectToSignIn } from '@clerk/nextjs';
import { FileCheck, ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { isAdmin } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCandidates } from '@/db/queries/candidates';
import { CandidateCard } from '@/components/candidate-card';
import { getAvailableCities } from '@/db/queries';
import { getPausedCompanions } from '@/db/queries/paused';
import { PausedCompanions } from '@/components/paused-companions';
import { getPublishedImported } from '@/db/queries/candidates';
import { PublishedImportedList } from '@/components/published-imported';

/** Candidatas a anunciante à espera de contacto, ainda sem perfil na OneSugar. */
async function FetchCandidates() {
  const [candidates, cidades, publicadas] = await Promise.all([
    getCandidates(),
    getAvailableCities(),
    getPublishedImported(),
  ]);
  const cities = cidades
    .map((c) => ({ id: c.id, city: c.city }))
    .sort((a, b) => a.city.localeCompare(b.city, 'pt'));

  if (candidates.length === 0) {
    return (
      <div className="w-full space-y-8">
        <PublishedImportedList perfis={publicadas} />
        <p className="text-lg text-center text-gray-500">
          Não há candidatas importadas por rever.
        </p>
      </div>
    );
  }

  // A consulta já vem ordenada por distrito; aqui só se agrupa, mantendo a
  // ordem e, dentro de cada distrito, a pontuação.
  const porDistrito = new Map<string, { nome: string; lista: typeof candidates }>();
  for (const candidate of candidates) {
    const slug = candidate.distritoSlug ?? 'sem-distrito';
    const grupo = porDistrito.get(slug) ?? { nome: candidate.distrito ?? 'Sem distrito', lista: [] };
    grupo.lista.push(candidate);
    porDistrito.set(slug, grupo);
  }

  return (
    <div className="w-full space-y-8">
      <PublishedImportedList perfis={publicadas} />
      <nav aria-label="Distritos" className="flex flex-wrap gap-2">
        {[...porDistrito].map(([slug, { nome, lista }]) => (
          <a
            key={slug}
            href={`#importadas-${slug}`}
            className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
          >
            {nome} <span className="text-muted-foreground">({lista.length})</span>
          </a>
        ))}
      </nav>

      {[...porDistrito].map(([slug, { nome, lista }]) => (
        <section key={slug} id={`importadas-${slug}`} className="scroll-mt-24 space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">
            {nome} <span className="text-muted-foreground font-normal">· {lista.length}</span>
          </h2>
          <div className="flex flex-col items-center space-y-8">
            {lista.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} cities={cities} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Perfis publicados mas escondidos, que de outra forma não têm onde aparecer. */
async function FetchPaused() {
  return <PausedCompanions companions={await getPausedCompanions()} />;
}

async function FetchUnverifiedCompanions() {
  const response = await getUnverifiedCompanions();
  return <VerifyCompanionsList initialCompanions={response} />;
}

/** Recusados: a recusa não apaga, por isso ficam aqui para reverter ou apagar de vez. */
async function FetchRejected() {
  return <RejectedCompanions companions={await getRejectedCompanions()} />;
}

function CompanionsListSkeleton() {
  return (
    <div className="space-y-4 w-full max-w-2xl">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="w-full h-[430px]" />
      ))}
    </div>
  );
}

export default async function VerifyCompanionPage() {
  // A verificação fica aqui, antes dos separadores: as duas listas trazem
  // dados pessoais e nenhuma deve chegar a ser calculada para outra pessoa.
  const { userId } = await auth();
  if (!userId) {
    return <RedirectToSignIn />;
  }
  if (!isAdmin(userId)) {
    redirect('/location');
  }

  return (
    <section className="p-4 flex flex-col items-center justify-center w-full h-full space-y-4">
      <h1 className="text-3xl font-bold">Companion Verification</h1>

      <div className="w-full max-w-2xl space-y-4 mb-4">
        <AlertDialog>
          <FileCheck className="h-4 w-4" />
          <AlertDialogTitle>Verificação de Documentos</AlertDialogTitle>
          <AlertDialogDescription>
            O perfil entra aqui logo que é criado, com ou sem vídeo e documento. Sem
            eles, pode ser aprovado sem selo (aparece como &quot;Não verificada&quot;).
            Com vídeo e documento enviados, aprova-se como verificada ou recusam-se os
            documentos primeiro. Recusar um perfil não apaga nada.
          </AlertDialogDescription>
        </AlertDialog>

        <AlertDialog>
          <ShieldAlert className="h-4 w-4" />
          <AlertDialogTitle>Requisitos de Verificação</AlertDialogTitle>
          {/* asChild com div: a descrição é um <p>, e uma lista dentro de um
              parágrafo é HTML inválido (dava erro de hidratação). */}
          <AlertDialogDescription asChild>
            <div>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Verifique se o vídeo de verificação mostra claramente o rosto do sugar</li>
                <li>Verifique se eles seguram um papel com a data e "onesugar" escrito nele</li>
                <li>Garanta que o documento de identificação corresponde às informações do perfil</li>
                <li>Todos os sugars devem ter 18+ anos para serem verificados</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialog>
      </div>

      <Tabs defaultValue="registos" className="w-full max-w-2xl">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registos">Registos</TabsTrigger>
          <TabsTrigger value="importadas">Importadas</TabsTrigger>
          <TabsTrigger value="pausa">Em pausa</TabsTrigger>
          <TabsTrigger value="recusadas">Recusadas</TabsTrigger>
        </TabsList>
        <TabsContent value="registos" className="mt-6">
          <Suspense fallback={<CompanionsListSkeleton />}>
            <FetchUnverifiedCompanions />
          </Suspense>
        </TabsContent>
        <TabsContent value="importadas" className="mt-6">
          <Suspense fallback={<CompanionsListSkeleton />}>
            <FetchCandidates />
          </Suspense>
        </TabsContent>
        <TabsContent value="pausa" className="mt-6">
          <Suspense fallback={<CompanionsListSkeleton />}>
            <FetchPaused />
          </Suspense>
        </TabsContent>
        <TabsContent value="recusadas" className="mt-6">
          <Suspense fallback={<CompanionsListSkeleton />}>
            <FetchRejected />
          </Suspense>
        </TabsContent>
      </Tabs>
    </section>
  );
}

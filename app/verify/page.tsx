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
import { contarPausadas, getPausedCompanions } from '@/db/queries/paused';
import { PausedCompanions } from '@/components/paused-companions';
import { contarPublishedImported, getPublishedImported } from '@/db/queries/candidates';
import { VerifyPager } from '@/components/verify-pager';
import { POR_PAGINA, paginaDe } from '@/lib/verify-paginas';
import Link from 'next/link';
import { PublishedImportedList } from '@/components/published-imported';
import { getPerfisParaTraducao } from '@/app/actions/traducoes';
import { TraducoesPerfis } from '@/components/traducoes-perfis';
import { AdminPhoneSearch } from '@/components/admin-phone-search';
import { VerifySearchResults } from '@/components/verify-search-results';
import { digitosDaBusca, perfisPorTelefone } from '@/lib/admin-phone-search';

/** Candidatas a anunciante à espera de contacto, ainda sem perfil na OneSugar. */
async function FetchCandidates({ pagina }: { pagina: number }) {
  const [candidates, cidades, publicadas, totalPublicadas] = await Promise.all([
    getCandidates(),
    getAvailableCities(),
    getPublishedImported({ limite: POR_PAGINA, desvio: (pagina - 1) * POR_PAGINA }),
    contarPublishedImported(),
  ]);
  const cities = cidades
    .map((c) => ({ id: c.id, city: c.city }))
    .sort((a, b) => a.city.localeCompare(b.city, 'pt'));

  const paginador = (
    <VerifyPager aba="importadas" pagina={pagina} total={totalPublicadas} porPagina={POR_PAGINA} />
  );

  if (candidates.length === 0) {
    return (
      <div className="w-full space-y-8">
        <PublishedImportedList perfis={publicadas} total={totalPublicadas} />
        {paginador}
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
      <PublishedImportedList perfis={publicadas} total={totalPublicadas} />
      {paginador}
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
async function FetchPaused({ pagina }: { pagina: number }) {
  const [companions, total] = await Promise.all([
    getPausedCompanions({ limite: POR_PAGINA, desvio: (pagina - 1) * POR_PAGINA }),
    contarPausadas(),
  ]);
  return (
    <div className="space-y-4">
      <PausedCompanions companions={companions} total={total} />
      <VerifyPager aba="pausa" pagina={pagina} total={total} porPagina={POR_PAGINA} />
    </div>
  );
}

async function FetchUnverifiedCompanions() {
  const response = await getUnverifiedCompanions();
  return <VerifyCompanionsList initialCompanions={response} />;
}

/** Versão inglesa (/en) das descrições dos perfis publicados. */
async function FetchTraducoes({ pagina }: { pagina: number }) {
  const r = await getPerfisParaTraducao(pagina, POR_PAGINA);
  return (
    <div className="space-y-4">
      <TraducoesPerfis perfis={r.perfis} emFalta={r.emFalta} caracteresEmFalta={r.caracteresEmFalta} />
      <VerifyPager aba="ingles" pagina={pagina} total={r.total} porPagina={POR_PAGINA} />
    </div>
  );
}

/** Recusados: a recusa não apaga, por isso ficam aqui para reverter ou apagar de vez. */
async function FetchRejected() {
  return <RejectedCompanions companions={await getRejectedCompanions()} />;
}

/**
 * Busca por telefone: o cartão completo de cada perfil com esse número, em
 * qualquer estado, e as candidatas importadas ainda sem perfil. Só isto é
 * calculado, sem a fila nem os outros separadores.
 */
async function FetchBusca({ tel }: { tel: string }) {
  const { perfis: encontrados, limitado } = await perfisPorTelefone(tel);
  const companionIds = encontrados.map((p) => p.companionId);
  const [perfis, candidatas, cidades, importadasLista] = await Promise.all([
    getUnverifiedCompanions({ companionIds }),
    getCandidates({ telefone: tel }),
    getAvailableCities(),
    getPublishedImported({ companionIds }),
  ]);
  const controlos = Object.fromEntries(encontrados.map((p) => [p.companionId, p]));
  const importadas = Object.fromEntries(importadasLista.map((p) => [p.companionId, p]));
  const ordem = new Map(companionIds.map((id, i) => [id, i]));
  perfis.sort((a, b) => (ordem.get(a.id) ?? 0) - (ordem.get(b.id) ?? 0));
  const cities = cidades
    .map((c) => ({ id: c.id, city: c.city }))
    .sort((a, b) => a.city.localeCompare(b.city, 'pt'));

  const total = perfis.length + candidatas.length;
  return (
    <div className="w-full max-w-2xl space-y-6">
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? 'Nenhum perfil nem candidata com este número.'
          : `${perfis.length} ${perfis.length === 1 ? 'perfil' : 'perfis'}` +
            (candidatas.length
              ? ` e ${candidatas.length} ${candidatas.length === 1 ? 'candidata sem perfil' : 'candidatas sem perfil'}`
              : '') +
            ' com este número.'}
        {limitado && ' Há mais: escreva mais dígitos para afinar.'}
      </p>
      <VerifySearchResults companions={perfis} controlos={controlos} importadas={importadas} />
      {candidatas.length > 0 && (
        <div className="flex flex-col items-center space-y-8">
          {candidatas.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} cities={cities} />
          ))}
        </div>
      )}
    </div>
  );
}

const ABAS = [
  ['registos', 'Registos'],
  ['importadas', 'Importadas'],
  ['pausa', 'Em pausa'],
  ['recusadas', 'Recusadas'],
  ['ingles', 'Inglês'],
] as const;

function CompanionsListSkeleton() {
  return (
    <div className="space-y-4 w-full max-w-2xl">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="w-full h-[430px]" />
      ))}
    </div>
  );
}

export default async function VerifyCompanionPage({
  searchParams,
}: {
  searchParams: Promise<{ tel?: string | string[]; aba?: string | string[]; pag?: string | string[] }>;
}) {
  // A verificação fica aqui, antes dos separadores: as duas listas trazem
  // dados pessoais e nenhuma deve chegar a ser calculada para outra pessoa.
  const { userId } = await auth();
  if (!userId) {
    return <RedirectToSignIn />;
  }
  if (!isAdmin(userId)) {
    redirect('/location');
  }

  const { tel: telParam, aba: abaParam, pag: pagParam } = await searchParams;
  const tel = digitosDaBusca(Array.isArray(telParam) ? telParam[0] : telParam);
  const abaPedida = Array.isArray(abaParam) ? abaParam[0] : abaParam;
  const aba = ABAS.find(([valor]) => valor === abaPedida)?.[0] ?? 'registos';
  const pagina = paginaDe(pagParam);

  // Com um número no filtro, só os cartões desse número.
  if (tel) {
    return (
      <section className="p-4 flex flex-col items-center justify-center w-full h-full space-y-4">
        <h1 className="text-3xl font-bold">Companion Verification</h1>
        <AdminPhoneSearch inicial={tel} />
        <Suspense fallback={<CompanionsListSkeleton />}>
          <FetchBusca tel={tel} />
        </Suspense>
      </section>
    );
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

      <AdminPhoneSearch />

      {/* Os separadores são ligações (?aba=…) e só o aberto é calculado. Antes
          eram os cinco de uma vez (mais de 2 MB de HTML, com listas de mais
          de mil linhas) mesmo que só se visse o primeiro. */}
      <Tabs value={aba} className="w-full max-w-2xl">
        <TabsList className="grid w-full grid-cols-5">
          {ABAS.map(([valor, rotulo]) => (
            <TabsTrigger key={valor} value={valor} asChild>
              <Link href={valor === 'registos' ? '/verify' : `/verify?aba=${valor}`} prefetch={false}>
                {rotulo}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={aba} className="mt-6">
          <Suspense key={`${aba}-${pagina}`} fallback={<CompanionsListSkeleton />}>
            {aba === 'registos' && <FetchUnverifiedCompanions />}
            {aba === 'importadas' && <FetchCandidates pagina={pagina} />}
            {aba === 'pausa' && <FetchPaused pagina={pagina} />}
            {aba === 'recusadas' && <FetchRejected />}
            {aba === 'ingles' && <FetchTraducoes pagina={pagina} />}
          </Suspense>
        </TabsContent>
      </Tabs>
    </section>
  );
}

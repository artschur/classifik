import { ProfileCard } from '@/components/home/profile-card';
import { LocaleLink } from '@/components/locale-link';
import {
  getOutrosGenerosNoDistrito,
  getPerfisDosDistritos,
  type CatalogCompanion,
} from '@/db/queries/catalog';
import { getCompanionDistrict } from '@/db/queries/companions';
import { DISTRITOS_VIZINHOS, distritoPorSlug, inDistrict, nomeDistrito } from '@/lib/districts';
import type { Locale } from '@/lib/i18n';

const MAXIMO = 8;
/** Quantos perfis se vão buscar para escolher os 8 (mais do que um distrito tem hoje). */
const CANDIDATOS = 60;

/**
 * Os perfis que vêm a seguir a este, numa roda ordenada pelo número do
 * perfil: depois do 253 vêm o 304, o 315..., e no fim volta ao início.
 *
 * Com os 8 primeiros por plano e data, os perfis mais antigos e sem plano
 * nunca entravam no bloco de ninguém (o crawl de 18/11 encontrou o 253 e o
 * 304, em Lisboa, sem nenhuma ligação). Na roda, cada perfil aparece no
 * bloco dos perfis que vêm antes dele, por isso todos recebem ligações, e
 * cada página mostra um conjunto diferente.
 */
function aSeguir(perfis: CatalogCompanion[], id: number): CatalogCompanion[] {
  const ordem = [...perfis].sort((a, b) => a.id - b.id);
  const corte = ordem.findIndex((p) => p.id > id);
  return corte <= 0 ? ordem : [...ordem.slice(corte), ...ordem.slice(0, corte)];
}

/** "em Lisboa" / "in Lisbon", para os títulos. */
function emDistrito(slug: string, locale: Locale): string {
  return locale === 'en' ? inDistrict(slug) : distritoPorSlug(slug).emNome;
}

/** Grelha de cartões com título e ligação para o distrito. */
function GrelhaDePerfis({
  titulo,
  ligacao,
  perfis,
  locale,
}: {
  titulo: string;
  ligacao?: { href: string; texto: string };
  perfis: CatalogCompanion[];
  locale: Locale;
}) {
  return (
    <section className="w-full" aria-label={titulo}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-2xl font-bold">{titulo}</h2>
        {ligacao && (
          <LocaleLink
            locale={locale}
            href={ligacao.href}
            className="text-sm font-medium text-rose-500 hover:underline"
          >
            {ligacao.texto} →
          </LocaleLink>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {perfis.map((p) => (
          <ProfileCard key={p.id} sugar={p} locale={locale} />
        ))}
      </div>
    </section>
  );
}

/**
 * "Outros perfis em Lisboa", no fim de cada perfil: até 8 perfis do mesmo
 * distrito, de todos os géneros, sem o próprio. Com menos de 4 no distrito,
 * completa com os distritos vizinhos.
 *
 * É a ligação interna que faltava aos perfis: a página do distrito abre em
 * feminino e o filtro de género não é uma ligação que o buscador siga, por
 * isso os perfis masculinos e trans não recebiam ligação nenhuma.
 */
export async function OutrosPerfis({ companionId, locale }: { companionId: number; locale: Locale }) {
  const distrito = await getCompanionDistrict(companionId).catch(() => null);
  if (!distrito) return null;
  const slug = distrito.slug;

  let perfis = aSeguir(
    await getPerfisDosDistritos([slug], companionId, CANDIDATOS).catch(() => []),
    companionId,
  ).slice(0, MAXIMO);
  const soDoDistrito = perfis.length >= 4;
  if (!soDoDistrito) {
    const vizinhos = aSeguir(
      await getPerfisDosDistritos(DISTRITOS_VIZINHOS[slug] ?? [], companionId, CANDIDATOS).catch(() => []),
      companionId,
    );
    perfis = [...perfis, ...vizinhos].slice(0, MAXIMO);
  }
  if (perfis.length === 0) return null;

  const onde = emDistrito(slug, locale);
  const en = locale === 'en';
  const titulo = soDoDistrito
    ? en
      ? `More profiles ${onde}`
      : `Outros perfis ${onde}`
    : en
      ? `Profiles ${onde} and nearby`
      : `Perfis ${onde} e nos distritos vizinhos`;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
      <GrelhaDePerfis
        titulo={titulo}
        ligacao={{
          href: `/location/${slug}`,
          texto: en ? `All profiles ${onde}` : `Ver todos os perfis ${onde}`,
        }}
        perfis={perfis}
        locale={locale}
      />
    </div>
  );
}

/**
 * Distrito sem nenhum perfil: em vez de uma página vazia (que o buscador
 * trata como "soft 404"), mostra os perfis dos distritos vizinhos.
 */
export async function PerfisVizinhos({ slug, locale }: { slug: string; locale: Locale }) {
  const vizinhos = DISTRITOS_VIZINHOS[slug] ?? ['lisboa', 'porto'];
  const perfis = await getPerfisDosDistritos(vizinhos, null, MAXIMO).catch(() => []);
  if (perfis.length === 0) return null;

  const en = locale === 'en';
  const nome = nomeDistrito(slug, locale);
  const lista = vizinhos.map((v) => nomeDistrito(v, locale));
  const nomes =
    lista.length > 1 ? `${lista.slice(0, -1).join(', ')} ${en ? 'and' : 'e'} ${lista.at(-1)}` : lista[0];

  return (
    <div className="mt-8 space-y-4">
      <p className="text-sm text-muted-foreground">
        {en
          ? `There are no profiles ${inDistrict(slug)} yet. These are the closest ones, in ${nomes}.`
          : `Ainda não há perfis ${distritoPorSlug(slug, nome).emNome}. Estes são os mais próximos, em ${nomes}.`}
      </p>
      <GrelhaDePerfis
        titulo={en ? 'Profiles in nearby districts' : 'Perfis nos distritos vizinhos'}
        perfis={perfis}
        locale={locale}
      />
    </div>
  );
}

/**
 * "Também em Lisboa: acompanhantes masculinos (1)". Só aparece quando o
 * distrito tem perfis masculinos ou trans, que a página (aberta em feminino)
 * não mostra. É uma ligação normal, que o buscador segue.
 */
export async function OutrosGenerosNoDistrito({ slug, locale }: { slug: string; locale: Locale }) {
  const { masculino, trans } = await getOutrosGenerosNoDistrito(slug).catch(() => ({
    masculino: 0,
    trans: 0,
  }));
  if (!masculino && !trans) return null;

  const en = locale === 'en';
  const nome = nomeDistrito(slug, locale);
  const ligacoes = [
    masculino > 0 && {
      gender: 'masculino',
      texto: `${en ? 'male escorts' : 'acompanhantes masculinos'} (${masculino})`,
    },
    trans > 0 && {
      gender: 'trans',
      texto: `${en ? 'trans escorts' : 'acompanhantes trans'} (${trans})`,
    },
  ].filter(Boolean) as { gender: string; texto: string }[];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{en ? `Also in ${nome}:` : `Também ${distritoPorSlug(slug, nome).emNome}:`}</span>
      {ligacoes.map((l) => (
        <LocaleLink
          key={l.gender}
          locale={locale}
          href={`/location/${slug}?gender=${l.gender}`}
          className="font-semibold text-rose-500 hover:underline"
        >
          {l.texto} →
        </LocaleLink>
      ))}
    </div>
  );
}

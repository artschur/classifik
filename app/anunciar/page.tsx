import type { Metadata } from 'next';
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  HandCoins,
  IdCard,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  UserPlus,
  Users,
  UserRound,
  MessageCircle,
  BookOpen,
  Calculator,
} from 'lucide-react';
import { BreadcrumbTrail } from '@/components/breadcrumb-trail';
import { FaqAcordeao } from '@/components/faq-acordeao';
import { LocaleLink } from '@/components/locale-link';
import { getLocale } from '@/lib/locale.server';
import { OG_LOCALE, absoluteUrl, pageAlternates } from '@/lib/i18n';
import { InicioRegisto } from './inicio-registo';
import { BarraFixa } from './barra-fixa';
import { TEXTOS, WHATSAPP_APOIO } from './textos';

const CAMINHO = '/anunciar';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = TEXTOS[locale].meta;
  return {
    title: t.title,
    description: t.description,
    alternates: pageAlternates(CAMINHO, locale),
    openGraph: {
      title: `${t.title} | OneSugar`,
      description: t.description,
      url: absoluteUrl(CAMINHO, locale),
      locale: OG_LOCALE[locale],
      type: 'website',
    },
  };
}

const ICONES_PASSOS = [UserPlus, UserRound, MapPin, Camera, ShieldCheck, Sparkles];
const ICONES_PRECISA = [Smartphone, Camera, FileText, IdCard];
const ICONES_VERIFICACAO = [Camera, ShieldCheck, Eye];
const ICONES_PORQUE = [HandCoins, Search, SlidersHorizontal, Users];
const ICONES_LINKS = [BookOpen, Calculator, MessageCircle];
/** Índice do passo da verificação na lista de passos (destacado). */
const PASSO_VERIFICACAO = 4;

function Titulo({ id, h2, sub }: { id?: string; h2: string; sub: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h2 id={id} className="scroll-mt-24 text-2xl font-bold tracking-tight sm:text-3xl">
        {h2}
      </h2>
      <p className="mt-2 text-base text-muted-foreground">{sub}</p>
    </div>
  );
}

export default async function AnunciarPage() {
  const locale = await getLocale();
  const t = TEXTOS[locale];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.faq.itens.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-16">
        <BreadcrumbTrail
          locale={locale}
          passos={[
            { nome: t.migalha.inicio, caminho: '/' },
            { nome: t.migalha.pagina, caminho: CAMINHO },
          ]}
        />

        {/* Topo: promessa à esquerda, início do registo à direita */}
        <section className="grid items-start gap-8 pb-10 pt-2 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pb-14 lg:pt-6">
          <div className="lg:pt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-500">
              <Star className="h-3.5 w-3.5" />
              {t.hero.eyebrow}
            </span>
            <h1 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-tight sm:mt-4 sm:text-5xl">{t.hero.h1}</h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground sm:mt-4 sm:text-lg">{t.hero.lead}</p>
            <ul className="mt-4 flex flex-wrap gap-2 sm:mt-6">
              {t.hero.chips.map((c, i) => {
                const Icone = [HandCoins, BadgeCheck, Lock][i] ?? CheckCircle2;
                return (
                  <li
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium"
                  >
                    <Icone className="h-4 w-4 text-rose-500" />
                    {c}
                  </li>
                );
              })}
            </ul>
            <a
              href="#como-funciona"
              className="mt-6 hidden items-center gap-1.5 text-sm font-semibold text-rose-500 hover:underline lg:inline-flex"
            >
              {t.hero.verComo}
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          <div id="comecar" className="scroll-mt-24">
            <InicioRegisto t={t.form} locale={locale} />
            <a
              href="#como-funciona"
              className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-rose-500 hover:underline lg:hidden"
            >
              {t.hero.verComo}
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Como funciona */}
        <section className="pt-12 sm:pt-20">
          <Titulo id="como-funciona" h2={t.passos.h2} sub={t.passos.sub} />
          <div className="-mt-3 mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{t.precisa.titulo}</span>
            {t.precisa.itens.map((item, i) => {
              const Icone = ICONES_PRECISA[i];
              return (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm"
                >
                  <Icone className="h-3.5 w-3.5 text-rose-500" />
                  {item}
                </span>
              );
            })}
          </div>
          {/* No telemóvel, linha do tempo sem cartões; a partir de sm, cartões em grelha. */}
          <ol className="divide-y divide-border sm:grid sm:grid-cols-2 sm:gap-3 sm:divide-y-0 lg:grid-cols-3">
            {t.passos.itens.map((p, i) => {
              const Icone = ICONES_PASSOS[i];
              const seguranca = i === PASSO_VERIFICACAO;
              return (
                <li
                  key={p.titulo}
                  className={`relative flex gap-3 py-3.5 sm:gap-4 sm:rounded-2xl sm:border sm:p-5 ${
                    seguranca
                      ? 'my-1 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 px-3 sm:my-0'
                      : 'sm:border-border sm:bg-card'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                      seguranca ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    <Icone className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {t.passos.rotulos[i]}
                      </span>
                      {seguranca && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {t.passos.tagVerificacao}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold sm:mt-1">{p.titulo}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground sm:mt-1">{p.texto}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 flex gap-4 rounded-2xl border border-rose-500/40 bg-rose-500/5 p-4 sm:p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold">{t.passos.depois.titulo}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.passos.depois.texto}</p>
            </div>
          </div>
        </section>

        {/* Verificação: barreira de segurança */}
        <section className="pt-12 sm:pt-20">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 sm:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-4 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">{t.verificacao.h2}</h2>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">{t.verificacao.sub}</p>
            <div className="mt-5 space-y-4 md:mt-6 md:grid md:grid-cols-3 md:gap-3 md:space-y-0">
              {t.verificacao.blocos.map((b, i) => {
                const Icone = ICONES_VERIFICACAO[i];
                return (
                  <div key={b.titulo} className="flex gap-3 md:block md:rounded-2xl md:border md:border-border md:bg-card md:p-5">
                    <Icone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <h3 className="font-semibold md:mt-3">{b.titulo}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground md:mt-1">{b.texto}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4 sm:p-5 md:mt-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{t.verificacao.depoisTitulo}</strong> {t.verificacao.depoisTexto}
              </p>
            </div>
          </div>
        </section>

        {/* Porquê a OneSugar */}
        <section className="pt-12 sm:pt-20">
          <Titulo h2={t.porque.h2} sub={t.porque.sub} />
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {t.porque.itens.map((p, i) => {
              const Icone = ICONES_PORQUE[i];
              return (
                <li key={p.titulo} className="rounded-2xl border border-border bg-card p-3.5 sm:p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/15 text-rose-500 sm:h-10 sm:w-10">
                    <Icone className="h-5 w-5" />
                  </span>
                  <h3 className="mt-2.5 text-[15px] font-semibold leading-snug sm:mt-3 sm:text-base">{p.titulo}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.texto}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Planos, sem valores */}
        <section className="pt-12 sm:pt-20">
          <Titulo h2={t.planos.h2} sub={t.planos.sub} />
          <div className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-6">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.planos.gratis.nome}</span>
              <p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">
                {t.planos.gratis.preco}{' '}
                <span className="text-sm font-medium text-muted-foreground">{t.planos.gratis.precoNota}</span>
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm md:mt-4 md:grid-cols-1 md:gap-y-2.5">
                {t.planos.gratis.itens.map((i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col rounded-2xl border border-rose-500/50 bg-gradient-to-br from-rose-500/10 to-transparent p-4 sm:p-6">
              <span className="text-xs font-bold uppercase tracking-wide text-rose-500">{t.planos.destaque.nome}</span>
              <p className="mt-1 text-base font-semibold sm:mt-2 sm:text-lg">{t.planos.destaque.sub}</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm md:mt-4 md:gap-y-2.5">
                {t.planos.destaque.itens.map((i, n) => (
                  <li key={i} className={`flex gap-2 ${n === t.planos.destaque.itens.length - 1 ? 'col-span-2' : ''}`}>
                    <Star className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t.planos.nota}</p>
        </section>

        {/* Faixa de chamada. No telemóvel a barra fixa já faz este papel. */}
        <section className="hidden pt-12 sm:block sm:pt-20">
          <div className="flex flex-col items-start gap-5 rounded-3xl border border-rose-500/40 bg-gradient-to-br from-rose-600/20 via-rose-600/5 to-transparent p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.final.h2}</h2>
              <p className="mt-1 text-base text-muted-foreground">{t.final.texto}</p>
            </div>
            <a
              href="#comecar"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-950/30 transition-colors hover:bg-rose-500 md:w-auto"
            >
              {t.final.botao}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Texto para quem compara plataformas */}
        <section className="max-w-3xl pt-12 sm:pt-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.seo.h2}</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
            {t.seo.paragrafos.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
            <p>
              {t.seo.final.antes}
              <LocaleLink locale={locale} href="/quanto-ganha-acompanhante" className="font-medium text-rose-500 hover:underline">
                {t.seo.final.calculadora}
              </LocaleLink>
              {t.seo.final.meio}
              <LocaleLink locale={locale} href="/ajuda-anunciantes" className="font-medium text-rose-500 hover:underline">
                {t.seo.final.guia}
              </LocaleLink>
              {t.seo.final.depois}
            </p>
          </div>
        </section>

        {/* Perguntas frequentes */}
        <section className="max-w-3xl pt-12 sm:pt-20">
          <Titulo h2={t.faq.h2} sub={t.faq.sub} />
          <FaqAcordeao itens={t.faq.itens} className="bg-card" />
        </section>

        {/* Para onde ir a seguir */}
        <ul className="grid gap-2.5 pt-14 sm:grid-cols-3 sm:gap-3 sm:pt-20">
          {t.links.map((l, i) => {
            const Icone = ICONES_LINKS[i];
            const conteudo = (
              <>
                <Icone className="mt-0.5 h-5 w-5 shrink-0 text-rose-500 sm:mt-0" />
                <span>
                  <span className="flex items-center gap-1 font-semibold sm:mt-3">
                    {l.titulo}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground sm:mt-1">{l.texto}</span>
                </span>
              </>
            );
            const classe =
              'flex h-full gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-rose-500/50 sm:block sm:p-5';
            return (
              <li key={l.href}>
                {l.externo ? (
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className={classe}>
                    {conteudo}
                  </a>
                ) : (
                  <LocaleLink locale={locale} href={l.href} className={classe}>
                    {conteudo}
                  </LocaleLink>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <BarraFixa botao={t.fixo.botao} whatsapp={t.fixo.whatsapp} whatsappUrl={WHATSAPP_APOIO} />
    </>
  );
}

import Image from 'next/image';
import { SignUpButton } from '@clerk/nextjs';
import {
  Shield,
  MapPin,
  Clock,
  Star,
  Mic,
  Search,
  Calculator,
  ShoppingBag,
  ChevronRight,
  Heart,
  ShieldCheck,
  Video,
  UserCheck,
  MessageCircle,
} from 'lucide-react';
import { FeatureItem } from '@/components/v0/feature-tem';
import { SectionHeading } from '@/components/v0/section-heading';
import { HeroCarouselWrapper } from '@/components/hero-carousel-wrapper';
import { LiteYouTube } from '@/components/lite-youtube';
import { LocaleLink } from '@/components/locale-link';
import { PlanType } from '@/db/queries/kv';
import type { getDoDiaCompanion } from '@/db/queries/companions';
import { nomeDistrito } from '@/lib/districts';
import { absoluteUrl } from '@/lib/i18n';
import { ORGANIZATION_ID, WEBSITE_ID } from '@/lib/brand';

/**
 * Home em inglês (/en).
 *
 * Fica num ficheiro à parte para a home portuguesa não encher de condições.
 * Segue a mesma estrutura e os mesmos estilos, com o texto escrito para quem
 * visita Portugal (turistas, expatriados, viagens de negócios) e não
 * traduzido à letra. Ligações para páginas que ainda não têm versão inglesa
 * levam ao português (ver LocaleLink).
 */

type DoDia = Awaited<ReturnType<typeof getDoDiaCompanion>>;

const L = 'en' as const;

const heroHeadline = (
  <>
    Verified <span className="text-rose-400">escorts</span> in Portugal, all in one place
  </>
);

const popularLinks = [
  { href: '/location', label: 'Browse escorts', icon: <Heart className="h-5 w-5" /> },
  { href: '/companions', label: 'All verified profiles', icon: <ShieldCheck className="h-5 w-5" /> },
  { href: '/quanto-ganha-acompanhante', label: 'Earnings calculator', icon: <Calculator className="h-5 w-5" /> },
  { href: '/ajuda-anunciantes', label: 'How to advertise', icon: <UserCheck className="h-5 w-5" /> },
  { href: '/checkout', label: 'Featured plans (in Portuguese)', icon: <ShoppingBag className="h-5 w-5" /> },
];

const regions = [
  {
    title: 'Northern Portugal',
    text: 'Porto and Braga are two of the busiest areas on the platform, with a wide choice of verified escorts and companions for dinners and social events. Viana do Castelo, Bragança and Vila Real complete the north.',
    slugs: ['porto', 'braga', 'viana-do-castelo', 'braganca', 'vila-real'],
  },
  {
    title: 'Central Portugal',
    text: 'Coimbra and Aveiro lead the centre of the country, and Leiria keeps growing thanks to its spot between Lisbon and the north. The region also covers Viseu, Guarda and Castelo Branco.',
    slugs: ['coimbra', 'aveiro', 'leiria', 'viseu', 'guarda', 'castelo-branco'],
  },
  {
    title: 'Lisbon, Alentejo and the Algarve',
    text: 'Lisbon has the largest number of active profiles, followed by Setúbal, which covers the south bank of the Tagus. The Algarve, around Faro, sees steady demand from international visitors all year round. Évora, Beja, Portalegre and Santarém complete the south.',
    slugs: ['lisboa', 'setubal', 'santarem', 'evora', 'beja', 'faro', 'portalegre'],
  },
  {
    title: 'The islands',
    text: 'Madeira is an international destination with growing demand for verified companions, and OneSugar has active profiles on the island.',
    slugs: ['madeira'],
  },
];

/** "Escorts in the Algarve" para Faro, que é como quem viaja procura. */
function districtLabel(slug: string): string {
  if (slug === 'faro') return 'Escorts in the Algarve';
  return `Escorts in ${nomeDistrito(slug, L)}`;
}

const faq = [
  {
    q: 'What is OneSugar?',
    a: 'OneSugar is a Portuguese platform for finding verified escorts and companions in Portugal. It covers all 18 districts of mainland Portugal plus Madeira, and every profile goes through an identity check before it is published.',
  },
  {
    q: 'How are profiles verified?',
    a: 'Each companion confirms her identity, sends a recent photo and confirms her availability before her profile goes live. OneSugar uses audio, video and document checks to make sure the person in the photos is the person you will meet. Profiles that fail the check are not published.',
  },
  {
    q: 'Do the companions speak English?',
    a: 'Many do. Each profile lists the languages the companion speaks, so you can check before you get in touch.',
  },
  {
    q: 'Is it safe and discreet to contact a companion through OneSugar?',
    a: 'Yes. You contact the companion directly, by WhatsApp or the channels on her profile, with no middleman. OneSugar does not keep a record of conversations between clients and companions and does not share personal data with third parties.',
  },
  {
    q: 'Is escorting legal in Portugal?',
    a: 'Consensual adult sex work is not a crime in Portugal. OneSugar works as a classifieds portal for escort listings: it does not act as an intermediary and does not facilitate sexual exploitation in any form. It is only a space for advertising.',
  },
  {
    q: 'How can I advertise as a companion on OneSugar?',
    a: 'Advertising is free. You create your profile, go through the identity check and, once approved, your profile appears on your district page and in the platform search. Featured plans give extra visibility.',
  },
];

function HomeSchemasEn() {
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${absoluteUrl('/', L)}#webpage`,
    url: absoluteUrl('/', L),
    name: 'OneSugar | Verified Escorts in Portugal',
    description:
      'Verified escorts and companions in Lisbon, Porto, the Algarve and every district of Portugal.',
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'en',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

function Stats({ compact = false }: { compact?: boolean }) {
  const items = compact
    ? [
        ['18', 'districts'],
        ['100%', 'verified'],
        ['€0', 'to advertise'],
      ]
    : [
        ['18', 'districts covered'],
        ['100%', 'identity checked'],
        ['€0', 'to advertise'],
      ];
  return (
    <ul className={compact ? 'flex justify-center gap-6 text-white/80' : 'flex flex-wrap gap-x-8 gap-y-3 text-white/80'}>
      {items.map(([value, label]) => (
        <li key={label}>
          <span className={compact ? 'block text-xl font-bold text-white' : 'block text-2xl lg:text-3xl font-bold text-white'}>
            {value}
          </span>
          <span className={compact ? 'text-sm text-white/60' : 'text-base text-white/60'}>{label}</span>
        </li>
      ))}
    </ul>
  );
}

function PopularLinks({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? 'w-full rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-sm overflow-hidden text-left shadow-lg'
          : 'w-full max-w-lg rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-sm overflow-hidden shadow-lg'
      }
    >
      <p className={`${compact ? 'px-4' : 'px-5'} pt-4 pb-3 text-xs font-bold uppercase tracking-widest text-white/50`}>
        Popular links
      </p>
      <div className="divide-y divide-white/10">
        {popularLinks.map((item) => (
          <LocaleLink
            key={item.href}
            locale={L}
            href={item.href}
            className={`flex items-center gap-4 ${compact ? 'px-4' : 'px-5'} py-4 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors group`}
          >
            <span className="h-10 w-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="h-5 w-5 text-white/40 shrink-0" />
          </LocaleLink>
        ))}
      </div>
    </div>
  );
}

function DoDiaInfo({ doDia, compact = false }: { doDia: NonNullable<DoDia>; compact?: boolean }) {
  return (
    <div className={compact ? 'relative z-10 w-full max-w-xs space-y-2 text-center' : 'relative z-10 w-full max-w-xs lg:max-w-sm mt-6 space-y-2.5'}>
      <span className={`inline-flex items-center gap-2 text-rose-300 ${compact ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-widest`}>
        <Star className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
        Today&apos;s featured companion
      </span>
      <div className={`flex items-center gap-2.5 ${compact ? 'justify-center' : ''}`}>
        <span className={compact ? 'text-xl font-bold text-white' : 'text-2xl lg:text-3xl font-bold text-white'}>{doDia.name}</span>
        {doDia.verified && <ShieldCheck className="h-6 w-6 text-rose-400 shrink-0" />}
      </div>
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-white/80 text-base font-medium ${compact ? 'justify-center' : ''}`}>
        <span>{doDia.age} years old</span>
        <span className="text-white/30">·</span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {nomeDistrito(doDia.city, L)}
        </span>
      </div>
      <LocaleLink
        locale={L}
        href={`/companions/${doDia.id}`}
        className="inline-flex items-center gap-2 text-rose-300 hover:text-rose-200 text-sm font-bold transition-colors"
      >
        View profile →
      </LocaleLink>
    </div>
  );
}

function JoinCta() {
  return (
    <section className="py-10 px-6">
      <div className="container mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-rose-950/60 to-zinc-900 border border-rose-900/30 px-8 py-10 text-center space-y-6">
        <h2 className="text-2xl font-bold">Join OneSugar</h2>
        <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
          Advertise as a verified companion or find the right company for your stay in Portugal.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <LocaleLink
            locale={L}
            href="/quanto-ganha-acompanhante"
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-7 py-3 rounded-full transition-colors text-sm"
          >
            Sign up as a companion
          </LocaleLink>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="border border-rose-500/60 text-rose-300 hover:bg-rose-600/10 font-semibold px-7 py-3 rounded-full transition-colors text-sm"
            >
              Sign up as a client
            </button>
          </SignUpButton>
        </div>
      </div>
    </section>
  );
}

export function HomeEn({ doDia }: { doDia: DoDia }) {
  const doDiaHref = doDia ? `/companions/${doDia.id}` : '/companions';
  const doDiaAlt = doDia
    ? `${doDia.name}, featured companion on OneSugar`
    : 'OneSugar, verified escorts in Portugal';

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* HERO */}
        <section aria-labelledby="hero-heading-mobile">
          {/* Desktop */}
          <div className="relative hidden md:flex items-center w-full min-h-[52vh] lg:min-h-[80vh] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,_#9f1239_0%,_#4c0519_35%,_#000000_70%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/40" />
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_70%_40%,_#f43f5e22_0%,_transparent_70%)]" />

            <div className="relative z-10 w-full max-w-screen-xl mx-auto py-12 grid grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 bg-rose-600/20 border border-rose-500/40 text-rose-300 text-sm font-bold px-4 py-1.5 rounded-full">
                  <ShieldCheck className="h-4 w-4 text-rose-400" />
                  Every profile checked by hand
                </span>

                {/* Mesmo texto do H1 mobile, aqui como <p> para haver um só H1 */}
                <p className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter text-white">
                  {heroHeadline}
                </p>

                <Stats />

                <div className="flex flex-wrap items-center gap-3">
                  <LocaleLink
                    locale={L}
                    href="/location"
                    className="inline-flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white text-base font-bold px-7 py-3.5 rounded-full shadow-lg shadow-rose-900/40 transition-colors"
                  >
                    Find an escort
                  </LocaleLink>
                  <LocaleLink
                    locale={L}
                    href="/quanto-ganha-acompanhante"
                    className="inline-flex items-center justify-center border border-white/30 hover:border-white/60 hover:bg-white/5 text-white text-base font-semibold px-7 py-3.5 rounded-full transition-colors"
                  >
                    Advertise as a companion
                  </LocaleLink>
                </div>

                <LocaleLink
                  locale={L}
                  href="/location"
                  className="group flex items-center gap-3 w-full max-w-md bg-white rounded-full pl-5 pr-2 py-2 shadow-xl ring-1 ring-black/5 text-left transition-transform hover:scale-[1.01]"
                >
                  <span className="flex-1 text-sm text-neutral-500 font-medium">
                    Search escorts by district
                  </span>
                  <span className="h-10 w-10 rounded-full bg-rose-600 group-hover:bg-rose-500 flex items-center justify-center shrink-0 transition-colors">
                    <Search className="h-4 w-4 text-white" />
                  </span>
                </LocaleLink>

                <PopularLinks />
              </div>

              <div className="flex flex-col items-center w-full">
                <div className="relative w-full max-w-xs lg:max-w-sm">
                  <div className="absolute -inset-4 rounded-[2.5rem] bg-rose-600/30 blur-2xl" />
                  <div className="absolute -inset-8 rounded-[3rem] bg-rose-900/20 blur-3xl" />
                  <LocaleLink
                    locale={L}
                    href={doDiaHref}
                    className="block relative rounded-[1rem] overflow-hidden ring-1 ring-rose-500/40 shadow-[0_0_40px_-4px_rgba(244,63,94,0.5)] aspect-square w-full group"
                  >
                    <Image
                      src={doDia?.imageUrl ?? '/banner-square.jpeg'}
                      alt={doDiaAlt}
                      fill
                      className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      priority
                    />
                  </LocaleLink>
                </div>
                {doDia && <DoDiaInfo doDia={doDia} />}
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex flex-col md:hidden overflow-hidden">
            <div className="relative bg-[radial-gradient(ellipse_at_60%_30%,_#9f1239_0%,_#4c0519_40%,_#000000_75%)] px-6 pt-10 pb-8 flex flex-col items-center gap-6">
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/50 pointer-events-none" />

              <div className="relative z-10 w-full max-w-xs">
                <div className="absolute -inset-4 rounded-[2.5rem] bg-rose-600/30 blur-2xl" />
                <LocaleLink
                  locale={L}
                  href={doDiaHref}
                  className="block relative rounded-[2rem] overflow-hidden ring-1 ring-rose-500/40 shadow-[0_0_40px_-4px_rgba(244,63,94,0.5)] aspect-square group"
                >
                  <Image
                    src={doDia?.imageUrl ?? '/onesugar-mobile.jpeg'}
                    alt={doDiaAlt}
                    fill
                    className="object-cover object-center"
                    priority
                  />
                </LocaleLink>
              </div>

              {doDia && <DoDiaInfo doDia={doDia} compact />}

              <div className="relative z-10 w-full space-y-4 text-center">
                <span className="inline-flex items-center gap-2 bg-rose-600/20 border border-rose-500/40 text-rose-300 text-xs font-bold px-4 py-1.5 rounded-full mx-auto">
                  <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
                  Every profile checked by hand
                </span>
                <h1 id="hero-heading-mobile" className="text-2xl sm:text-3xl font-bold tracking-tighter text-white">
                  {heroHeadline}
                </h1>

                <Stats compact />

                <div className="flex flex-col gap-2.5">
                  <LocaleLink
                    locale={L}
                    href="/location"
                    className="w-full inline-flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold px-6 py-3.5 rounded-full shadow-lg shadow-rose-900/40 transition-colors"
                  >
                    Find an escort
                  </LocaleLink>
                  <LocaleLink
                    locale={L}
                    href="/quanto-ganha-acompanhante"
                    className="w-full inline-flex items-center justify-center border border-white/30 hover:border-white/60 text-white text-sm font-semibold px-6 py-3.5 rounded-full transition-colors"
                  >
                    Advertise as a companion
                  </LocaleLink>
                </div>

                <PopularLinks compact />
              </div>
            </div>
          </div>
        </section>

        {/* CAROUSEL */}
        <HeroCarouselWrapper plans={[PlanType.VIP, PlanType.PLUS, PlanType.CLASSIC]} />

        <JoinCta />

        {/* VIDEO */}
        <div className="flex justify-center w-full px-4 py-8">
          <div className="w-full max-w-4xl">
            <LiteYouTube videoId="t9drDCVVev0" title="OneSugar, verified escorts in Portugal (video in Portuguese)" />
          </div>
        </div>

        {/* EDITORIAL INTRO */}
        <section className="py-10 px-6">
          <div className="container mx-auto max-w-3xl text-center">
            <p className="text-base text-muted-foreground leading-relaxed">
              OneSugar brings together verified escorts and companions across
              Portugal, from the Cascais coast to the Algarve and from Porto to
              the Alentejo. What sets it apart is the check behind every
              listing: confirmed identity, a recent photo and real availability
              before a profile is ever published.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mt-3">
              Whether you are in Portugal for a holiday, a conference or a few
              months of remote work, you can browse{' '}
              <LocaleLink locale={L} href="/location/lisboa" className="text-rose-500 hover:underline">
                escorts in Lisbon
              </LocaleLink>
              ,{' '}
              <LocaleLink locale={L} href="/location/porto" className="text-rose-500 hover:underline">
                escorts in Porto
              </LocaleLink>{' '}
              or{' '}
              <LocaleLink locale={L} href="/location/faro" className="text-rose-500 hover:underline">
                in the Algarve
              </LocaleLink>
              , check which languages each companion speaks and contact her
              directly, with no agency in between.
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-12 px-6 bg-card/50">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">
              How OneSugar keeps every profile real
            </h2>
            <p className="text-base text-muted-foreground text-center mb-10">
              Tools that let you check a companion before you get in touch.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <Mic className="w-6 h-6 text-rose-500" />, title: 'Voice verification', desc: 'Hear a voice message recorded by the companion herself.' },
                { icon: <ShieldCheck className="w-6 h-6 text-rose-500" />, title: 'Identity check', desc: 'Documents are checked by the OneSugar team before the profile goes live.' },
                { icon: <Video className="w-6 h-6 text-rose-500" />, title: 'Verification videos', desc: 'Watch a short video that confirms the photos are genuine.' },
                { icon: <Star className="w-6 h-6 text-rose-500" />, title: 'Real reviews', desc: 'Read what other clients say about each companion.' },
              ].map((f) => (
                <div key={f.title} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                  {f.icon}
                  <h3 className="font-semibold text-base">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-12 px-6">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">How OneSugar works</h2>
            <p className="text-base text-muted-foreground text-center mb-10">
              Find the right companion in three simple steps.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <MapPin className="w-7 h-7 text-rose-500" />,
                  title: 'Choose your district',
                  desc: 'Pick where you are staying and see the verified companions available nearby. OneSugar covers every district of Portugal, from Lisbon and Porto to Bragança and the Algarve.',
                },
                {
                  icon: <UserCheck className="w-7 h-7 text-rose-500" />,
                  title: 'Read her profile',
                  desc: 'See genuine photos, reviews from other clients, the languages she speaks and everything you need to know. Every profile was checked by OneSugar before it went live.',
                },
                {
                  icon: <MessageCircle className="w-7 h-7 text-rose-500" />,
                  title: 'Contact her directly',
                  desc: 'Get in touch privately, usually by WhatsApp, with no middleman. OneSugar keeps no record of your conversations and never shares personal data with third parties.',
                },
              ].map((s, i) => (
                <div key={s.title} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-rose-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {s.icon}
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE */}
        <section className="w-full py-4" aria-labelledby="why-choose-heading">
          <div className="container px-4 mx-auto md:px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <SectionHeading
                  title="Why OneSugar?"
                  description="A Portuguese platform built around safety, discretion and profiles you can trust."
                  centered={false}
                />
                <div className="space-y-4">
                  <FeatureItem icon={Shield} title="Verified by OneSugar" description="Every companion goes through a strict check, so the person you meet matches her profile." />
                  <FeatureItem icon={MapPin} title="All over Portugal" description="Companions in Lisbon, Porto, the Algarve and every district in between." />
                  <FeatureItem icon={Clock} title="Flexible availability" description="Arrange a meeting that fits your plans, whether you are here for one night or a few weeks." />
                  <FeatureItem icon={Star} title="Genuine reviews" description="Feedback from real clients on each companion's profile." />
                </div>
              </div>
              <Image
                src="/selecione-onesugar.png"
                width={800}
                height={800}
                alt="Smiling companion looking at the camera"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover mt-6 lg:mt-0 w-full max-w-[400px] lg:max-w-none"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              />
            </div>
          </div>
        </section>

        <JoinCta />

        {/* DISTRICT GRID */}
        <section className="py-12 px-6">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">
              Verified escorts in every district of Portugal
            </h2>
            <p className="text-base text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
              OneSugar has active profiles across mainland Portugal and Madeira.
              Pick a region to see the verified companions near you.
            </p>

            {regions.map((region) => (
              <div key={region.title} className="mb-10">
                <h3 className="text-base font-semibold mb-2 text-rose-500">{region.title}</h3>
                <p className="text-base text-muted-foreground mb-4 leading-relaxed">{region.text}</p>
                <div className="flex flex-wrap gap-3">
                  {region.slugs.map((slug) => (
                    <LocaleLink
                      key={slug}
                      locale={L}
                      href={`/location/${slug}`}
                      className="bg-card border border-border hover:border-rose-500 hover:text-rose-500 text-sm px-4 py-2 rounded-full transition-colors"
                    >
                      {districtLabel(slug)}
                    </LocaleLink>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-center mt-8">
              <LocaleLink
                locale={L}
                href="/location"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-full transition-colors text-sm"
              >
                See all districts
              </LocaleLink>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-6 bg-card/50">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-10">Frequently asked questions</h2>
            <div className="space-y-6">
              {faq.map((item) => (
                <div key={item.q} className="border-b border-border pb-5">
                  <h3 className="font-semibold text-base mb-2">{item.q}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="py-12 px-6 bg-card/50 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-xl font-bold mb-3">Visiting Portugal?</h2>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              Browse verified companions in the city you are staying in and get
              in touch with full discretion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <LocaleLink
                locale={L}
                href="/companions"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
              >
                See all profiles
              </LocaleLink>
              <LocaleLink
                locale={L}
                href="/location"
                className="border border-rose-600 text-rose-500 hover:bg-rose-600 hover:text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
              >
                Search by district
              </LocaleLink>
            </div>
          </div>
        </section>

        <HomeSchemasEn />
      </main>
    </div>
  );
}

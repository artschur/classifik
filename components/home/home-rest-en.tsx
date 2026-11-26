import Image from 'next/image';
import { FaqAcordeao } from '@/components/faq-acordeao';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { RegistarButton } from '@/components/registar-button';
import { Shield, MapPin, Star, Mic, UserCheck, MessageCircle } from 'lucide-react';
import { FeatureItem } from '@/components/v0/feature-tem';
import { SectionHeading } from '@/components/v0/section-heading';
import { LiteYouTube } from '@/components/lite-youtube';
import { LocaleLink } from '@/components/locale-link';
import { DistritosPorRegiao } from '@/components/home/distritos-por-regiao';
import { absoluteUrl } from '@/lib/i18n';
import { ORGANIZATION_ID, WEBSITE_ID } from '@/lib/brand';

/*
 * Resto da página principal em inglês (/en), abaixo do catálogo: as secções
 * da home inglesa anterior, com o texto escrito para quem visita Portugal
 * (turistas, expatriados, viagens de negócios) e não traduzido à letra.
 */
const L = 'en' as const;

const faq = [
  {
    q: 'What is OneSugar?',
    a: 'OneSugar is a Portuguese platform for escort and companion listings, with a page for each of the 18 districts of mainland Portugal plus Madeira. Every profile is reviewed by the team before it is published, and profiles with the Verified badge have confirmed their identity with a document.',
  },
  {
    q: 'How are profiles verified?',
    a: 'Before a profile goes live, the OneSugar team reviews its photos, details and contact number. The companion can then confirm her identity with a document and a video: once the team approves them, her profile gets the Verified badge.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
    </>
  );
}

function JoinCta() {
  return (
    <section className="py-10 px-6">
      <div className="container mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-rose-100 to-white border border-rose-200 px-8 py-10 text-center space-y-6 dark:from-rose-950/60 dark:to-zinc-900 dark:border-rose-900/30">
        <h2 className="text-2xl font-bold">Join OneSugar</h2>
        <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
          Advertise as a verified companion or find the right company for your stay in Portugal.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <LocaleLink
            locale={L}
            href="/anunciar"
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-7 py-3 rounded-full transition-colors text-sm"
          >
            Sign up as a companion
          </LocaleLink>
          {/* Com sessão iniciada, a janela de registo do Clerk não abre: o
              botão segue para as acompanhantes. */}
          <SignedOut>
            <RegistarButton>
              <button
                type="button"
                className="border border-rose-500/60 text-rose-600 hover:bg-rose-600/10 dark:text-rose-300 font-semibold px-7 py-3 rounded-full transition-colors text-sm"
              >
                Sign up as a client
              </button>
            </RegistarButton>
          </SignedOut>
          <SignedIn>
            <LocaleLink
              locale={L}
              href="/location"
              className="border border-rose-500/60 text-rose-600 hover:bg-rose-600/10 dark:text-rose-300 font-semibold px-7 py-3 rounded-full transition-colors text-sm"
            >
              Browse escorts
            </LocaleLink>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}

export function HomeRestEn() {
  return (
    <>
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
                desc: 'See genuine photos, reviews from other clients, the languages she speaks and everything you need to know. Every profile is reviewed by OneSugar before it goes live, and the Verified badge shows who confirmed her identity.',
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
                <FeatureItem icon={Shield} title="Reviewed by our team" description="No profile goes live without a check by our team, and the Verified badge shows who confirmed her identity with a document." />
                <FeatureItem icon={Mic} title="Voice introductions" description="Hear a voice message recorded by the companion herself before you get in touch." />
                <FeatureItem icon={Star} title="Genuine reviews" description="Feedback from real clients on each companion's profile." />
                <FeatureItem icon={MapPin} title="All over Portugal" description="Companions in Lisbon, Porto, the Algarve and other districts, with a page for each one." />
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

      {/* DISTRICT GRID: por região, com o número de perfis */}
      <DistritosPorRegiao
        locale="en"
        titulo="Verified escorts in every district of Portugal"
        subtitulo="Pick your district to see the profiles available near you."
      />

      {/* FAQ */}
      <section className="py-12 px-6 bg-card/50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-10">Frequently asked questions</h2>
          <FaqAcordeao itens={faq} />
        </div>
      </section>

      <HomeSchemasEn />
    </>
  );
}

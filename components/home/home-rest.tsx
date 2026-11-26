import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { RegistarButton } from '@/components/registar-button';
import { Shield, MapPin, Star, Mic, UserCheck, MessageCircle } from 'lucide-react';
import { FeatureItem } from '@/components/v0/feature-tem';
import { SectionHeading } from '@/components/v0/section-heading';
import { LiteYouTube } from '@/components/lite-youtube';
import { FaqAcordeao } from '@/components/faq-acordeao';
import { DistritosPorRegiao } from '@/components/home/distritos-por-regiao';
import {
  BRAND_ALTERNATE_NAMES,
  BRAND_NAME,
  ORGANIZATION_ID,
  WEBSITE_ID,
} from '@/lib/brand';

/*
 * Resto da página principal, abaixo do catálogo.
 *
 * Reorganizado na N11 (25/11/2026): saíram os blocos que repetiam a mesma
 * mensagem ("Junte-se" aparecia duas vezes, "Seja uma Sugar" e o convite
 * final repetiam a chamada para anunciar), "Recursos exclusivos" juntou-se ao
 * "Porquê escolher", e os distritos passaram a uma lista por região com o
 * número de perfis. Os textos foram revistos: grafia do Acordo Ortográfico,
 * a marca como OneSugar e só afirmações que o catálogo confirma.
 */

/** As perguntas frequentes: as mesmas no ecrã e nos dados estruturados. */
const FAQ = [
  {
    q: 'O que é a OneSugar?',
    a: 'A OneSugar é uma plataforma portuguesa de anúncios de acompanhantes, com uma página para cada distrito de Portugal continental e para a Madeira. Cada perfil é revisto pela equipa antes de ser publicado, e os perfis com o selo Verificada confirmaram a identidade com documento.',
  },
  {
    q: 'Como funciona a verificação de perfis na OneSugar?',
    a: 'Antes de ser publicado, cada perfil é revisto pela equipa, que confere as fotografias, os dados e o contacto. A acompanhante pode depois confirmar a identidade com documento e vídeo: quando a equipa aprova, o perfil ganha o selo Verificada.',
  },
  {
    q: 'A OneSugar tem acompanhantes em todo o país?',
    a: 'A OneSugar tem uma página para cada um dos 18 distritos de Portugal continental e para a Madeira. Em cada página vê os perfis disponíveis nesse distrito e, quando um distrito ainda não tem perfis, a página mostra os dos distritos vizinhos.',
  },
  {
    q: 'É seguro contactar acompanhantes pela OneSugar?',
    a: 'Sim. O contacto é feito diretamente com a acompanhante, sem intermediários. A OneSugar não guarda histórico de contactos entre utilizadores e acompanhantes, nem partilha dados pessoais com terceiros, e a revisão de cada perfil antes da publicação reduz os riscos dos portais sem moderação.',
  },
  {
    q: 'Como posso anunciar como acompanhante na OneSugar?',
    a: 'Pode criar o seu anúncio grátis em onesugar.pt/anunciar. Depois de a equipa aprovar o perfil, ele fica visível na página do seu distrito e nas pesquisas da plataforma. Os planos pagos são só para quem quer mais destaque.',
  },
];

function HomeSchemas() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    // name e alternateName alimentam o nome do site que o Google mostra no
    // resultado e ajudam a separar a marca de produtos com nome parecido.
    name: BRAND_NAME,
    alternateName: BRAND_ALTERNATE_NAMES,
    url: 'https://www.onesugar.pt',
    description:
      'Plataforma portuguesa de anúncios de acompanhantes, com perfis revistos pela equipa e uma página para cada distrito.',
    inLanguage: 'pt-PT',
    publisher: { '@id': ORGANIZATION_ID },
    // Sem SearchAction: o Google deixou de mostrar a caixa de pesquisa nos
    // resultados em 2024, e o modelo antigo só funcionava com o slug exato
    // de um distrito.
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'pt-PT',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

const CLASSE_CLIENTE =
  'border border-rose-500/60 text-rose-600 hover:bg-rose-600/10 dark:text-rose-300 font-semibold px-7 py-3 rounded-full transition-colors text-sm';

/**
 * "Registar como Cliente" abre o registo do Clerk numa janela, como na versão
 * inglesa. Antes ligava a /sign-up, uma página que não existe no site (o
 * Clerk usa as páginas dele), e dava 404. Depois de criar conta, o Clerk leva
 * a pessoa ao /onboarding, onde escolhe Cliente. Quem já tem sessão não tem
 * conta para criar, e a janela nem abriria: segue para as acompanhantes.
 */
function RegistarCliente() {
  return (
    <>
      <SignedOut>
        <RegistarButton>
          <button type="button" className={CLASSE_CLIENTE}>
            Registar como Cliente
          </button>
        </RegistarButton>
      </SignedOut>
      <SignedIn>
        <Link href="/location" className={CLASSE_CLIENTE}>
          Ver acompanhantes
        </Link>
      </SignedIn>
    </>
  );
}

export function HomeRest() {
  return (
    <>
      {/* ── JUNTE-SE (o único convite para anunciar) ── */}
      <section className="py-10 px-4 md:px-6">
        <div className="container mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-rose-100 to-white border border-rose-200 px-6 py-8 md:px-8 md:py-10 text-center space-y-5 dark:from-rose-950/60 dark:to-zinc-900 dark:border-rose-900/30">
          <h2 className="text-2xl font-bold">Junte-se à OneSugar</h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Anuncie como acompanhante ou encontre a companhia certa. O registo é grátis.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/anunciar"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-7 py-3 rounded-full transition-colors text-sm"
            >
              Registar como Sugar
            </Link>
            <RegistarCliente />
          </div>
        </div>
      </section>

      {/* ── VÍDEO ── */}
      <div className="flex justify-center w-full px-4 py-6">
        <div className="w-full max-w-4xl">
          <LiteYouTube videoId="t9drDCVVev0" title="OneSugar, acompanhantes verificadas em Portugal" />
        </div>
      </div>

      {/* ── TEXTO DE ABERTURA ── */}
      <section className="py-8 px-4 md:px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-base text-muted-foreground leading-relaxed">
            A OneSugar reúne num só sítio acompanhantes de todo o país, de
            Lisboa ao Porto e de Braga ao Algarve. Cada perfil é revisto pela
            equipa antes de ser publicado, e o selo Verificada mostra quem já
            confirmou a identidade com documento.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mt-3">
            Se procura uma{' '}
            <Link href="/location/lisboa" className="text-rose-500 hover:underline">
              acompanhante em Lisboa
            </Link>
            ,{' '}
            <Link href="/location/porto" className="text-rose-500 hover:underline">
              escorts no Porto
            </Link>{' '}
            ou companhia noutro ponto do país, escolha o distrito, filtre pelo
            que prefere e fale diretamente com a acompanhante, sem
            intermediários.
          </p>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="py-10 px-4 md:px-6">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            Como funciona a OneSugar
          </h2>
          <p className="text-base text-muted-foreground text-center mb-8">
            Encontre a sua acompanhante em três passos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="w-7 h-7 text-rose-500" />,
                title: 'Escolha o distrito',
                desc: 'Selecione onde está e veja os perfis disponíveis na sua zona. A OneSugar tem uma página para cada distrito de Portugal continental e para a Madeira.',
              },
              {
                icon: <UserCheck className="w-7 h-7 text-rose-500" />,
                title: 'Conheça o perfil',
                desc: 'Veja as fotografias, as avaliações de outros clientes e as informações essenciais. Cada perfil é revisto pela equipa antes de ser publicado, e o selo Verificada mostra quem confirmou a identidade.',
              },
              {
                icon: <MessageCircle className="w-7 h-7 text-rose-500" />,
                title: 'Fale diretamente',
                desc: 'Contacte a acompanhante de forma privada, sem intermediários. A OneSugar não guarda histórico de contactos nem partilha dados pessoais com terceiros.',
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
                <p className="text-base text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORQUÊ ESCOLHER (com o que era "Recursos exclusivos") ── */}
      <section className="w-full py-6" aria-labelledby="why-choose-heading">
        <div className="container px-4 mx-auto md:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <SectionHeading
                title="Porquê escolher a OneSugar?"
                description="Uma plataforma portuguesa pensada para a segurança, a discrição e perfis em que pode confiar."
                centered={false}
              />
              <div className="space-y-4">
                <FeatureItem
                  icon={Shield}
                  title="Perfis revistos pela equipa"
                  description="Nenhum perfil é publicado sem passar pela equipa. O selo Verificada indica quem confirmou a identidade com documento."
                />
                <FeatureItem
                  icon={Mic}
                  title="Áudios de apresentação"
                  description="Ouça a voz da acompanhante numa mensagem gravada por ela, antes de entrar em contacto."
                />
                <FeatureItem
                  icon={Star}
                  title="Avaliações reais"
                  description="Leia o que outros clientes dizem sobre cada perfil."
                />
                <FeatureItem
                  icon={MapPin}
                  title="Em todo o país"
                  description="Perfis em Lisboa, no Porto, no Algarve e noutros distritos, com uma página para cada um."
                />
              </div>
            </div>
            <Image
              src="/selecione-onesugar.png"
              width={800}
              height={800}
              alt="Acompanhante a sorrir para a câmara"
              className="mx-auto aspect-square overflow-hidden rounded-xl object-cover mt-6 lg:mt-0 w-full max-w-[400px] lg:max-w-none"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
            />
          </div>
        </div>
      </section>

      {/* ── DISTRITOS POR REGIÃO ── */}
      <DistritosPorRegiao
        locale="pt"
        titulo="Acompanhantes Verificadas nos 18 Distritos de Portugal"
        subtitulo="Escolha o seu distrito e veja os perfis disponíveis perto de si."
      />

      {/* ── PERGUNTAS FREQUENTES ── */}
      <section className="py-12 px-4 md:px-6 bg-card/50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-8">
            Perguntas frequentes sobre a OneSugar
          </h2>
          <FaqAcordeao itens={FAQ} />
        </div>
      </section>

      <HomeSchemas />
    </>
  );
}

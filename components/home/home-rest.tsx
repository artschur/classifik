import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs';
import {
  Shield,
  MapPin,
  Clock,
  Star,
  Mic,
  ShieldCheck,
  Video,
  UserCheck,
  MessageCircle,
} from 'lucide-react';
import { FeatureItem } from '@/components/v0/feature-tem';
import { SectionHeading } from '@/components/v0/section-heading';
import { LiteYouTube } from '@/components/lite-youtube';
import {
  BRAND_ALTERNATE_NAMES,
  BRAND_NAME,
  ORGANIZATION_ID,
  WEBSITE_ID,
} from '@/lib/brand';

/*
 * Resto da nova página principal, abaixo do catálogo: cópia das secções da
 * página actual (app/page.tsx) de "Junte-se à Onesugar" para baixo, com os
 * mesmos textos, ligações e dados estruturados. Fica copiado, e não partilhado,
 * para a página actual não mudar enquanto esta está em construção.
 */
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
      'A plataforma de referência para acompanhantes verificadas em Portugal. Perfis reais nos 18 distritos do país.',
    inLanguage: 'pt-PT',
    publisher: { '@id': ORGANIZATION_ID },
    // Sem SearchAction: o Google deixou de mostrar a caixa de pesquisa nos
    // resultados em 2024, e o modelo antigo só funcionava com o slug exato
    // de um distrito.
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'O que é a Onesugar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A Onesugar é a plataforma portuguesa de referência para quem procura acompanhantes verificadas em Portugal. Opera nos 18 distritos do país e distingue-se por rever cada perfil antes de o publicar; os perfis com o selo Verificada confirmaram a identidade com documento.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como funciona a verificação de perfis na Onesugar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cada acompanhante passa por verificação de identidade, fotografia actual e disponibilidade confirmada antes de o perfil ser publicado. A plataforma utiliza verificação por áudio, vídeo e documentos para garantir autenticidade. Perfis que não passam na verificação não são publicados.',
        },
      },
      {
        '@type': 'Question',
        name: 'A Onesugar tem acompanhantes verificadas em todo o Portugal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. A Onesugar tem perfis activos nos 18 distritos de Portugal: Lisboa, Porto, Braga, Coimbra, Aveiro, Faro, Setúbal, Leiria, Santarém, Viana do Castelo, Vila Real, Viseu, Guarda, Castelo Branco, Évora, Beja, Portalegre e Bragança.',
        },
      },
      {
        '@type': 'Question',
        name: 'É seguro contactar acompanhantes pela Onesugar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. A Onesugar não guarda histórico de contactos entre utilizadores e acompanhantes, nem partilha dados pessoais com terceiros. A revisão prévia de cada perfil e o selo Verificada reduzem os riscos associados a portais sem moderação.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como posso anunciar como acompanhante na Onesugar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Pode criar o seu perfil em onesugar.pt/companions/register. O processo inclui verificação de identidade e disponibilidade. Após aprovação, o perfil fica visível na página do distrito correspondente e nos resultados de pesquisa.',
        },
      },
    ],
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

// ── District data ─────────────────────────────────────────────────────────────

const districts = {
  norte: [
    { slug: 'porto',            label: 'Acompanhantes no Porto' },
    { slug: 'braga',            label: 'Acompanhantes em Braga' },
    { slug: 'viana-do-castelo', label: 'Acompanhantes em Viana do Castelo' },
    { slug: 'braganca',         label: 'Acompanhantes em Bragança' },
    { slug: 'vila-real',        label: 'Acompanhantes em Vila Real' },
  ],
  centro: [
    { slug: 'coimbra',        label: 'Acompanhantes em Coimbra' },
    { slug: 'aveiro',         label: 'Acompanhantes em Aveiro' },
    { slug: 'leiria',         label: 'Acompanhantes em Leiria' },
    { slug: 'viseu',          label: 'Acompanhantes em Viseu' },
    { slug: 'guarda',         label: 'Acompanhantes na Guarda' },
    { slug: 'castelo-branco', label: 'Acompanhantes em Castelo Branco' },
  ],
  sul: [
    { slug: 'lisboa',     label: 'Acompanhantes em Lisboa' },
    { slug: 'setubal',    label: 'Acompanhantes em Setúbal' },
    { slug: 'santarem',   label: 'Acompanhantes em Santarém' },
    { slug: 'evora',      label: 'Acompanhantes em Évora' },
    { slug: 'beja',       label: 'Acompanhantes em Beja' },
    { slug: 'faro',       label: 'Acompanhantes no Algarve' },
    { slug: 'portalegre', label: 'Acompanhantes em Portalegre' },
  ],
  ilhas: [
    { slug: 'madeira', label: 'Acompanhantes na Madeira' },
  ],
};

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
        <SignUpButton mode="modal">
          <button type="button" className={CLASSE_CLIENTE}>
            Registar como Cliente
          </button>
        </SignUpButton>
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
      {/* ── REGISTER CTA (above video) ── */}
      <section className="py-10 px-6">
        <div className="container mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-rose-100 to-white border border-rose-200 px-8 py-10 text-center space-y-6 dark:from-rose-950/60 dark:to-zinc-900 dark:border-rose-900/30">
          <h2 className="text-2xl font-bold">Junte-se à Onesugar</h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Seja uma Sugar verificada ou encontre a companhia ideal, registe-se agora.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/quanto-ganha-acompanhante"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-7 py-3 rounded-full transition-colors text-sm"
            >
              Registar como Sugar
            </Link>
            <RegistarCliente />
          </div>
        </div>
      </section>

      {/* ── VIDEO ── */}
      <div className="flex justify-center w-full px-4 py-8">
        <div className="w-full max-w-4xl">
          <LiteYouTube videoId="t9drDCVVev0" title="Onesugar, acompanhantes verificadas em Portugal" />
        </div>
      </div>

      {/* ── EDITORIAL INTRO ── */}
      <section className="py-10 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-base text-muted-foreground leading-relaxed">
            A Onesugar é a plataforma de referência para quem procura
            acompanhantes verificadas em Portugal. Com presença activa nos 18
            distritos do país, da Linha de Cascais ao Algarve, de Bragança ao
            Alentejo, a plataforma centraliza a oferta com um nível de
            verificação que a maioria dos portais não oferece: identidade
            confirmada, fotografia actual e disponibilidade real antes de
            qualquer publicação.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mt-3">
            Se está à procura de uma{' '}
            <Link href="/location/lisboa" className="text-rose-500 hover:underline">
              acompanhante em Lisboa
            </Link>
            , de{' '}
            <Link href="/location/porto" className="text-rose-500 hover:underline">
              escorts no Porto
            </Link>{' '}
            ou de companhia verificada em qualquer outro ponto do país, a
            Onesugar tem perfis activos nas principais cidades e capitais de
            distrito de Portugal. Navegue por distrito, filtre por preferência
            e entre em contacto directamente, sem intermediários.
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-12 px-6 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            Recursos exclusivos da Onesugar para acompanhantes em Portugal
          </h2>
          <p className="text-base text-muted-foreground text-center mb-10">
            Oferecemos ferramentas inovadoras para garantir a sua satisfação e
            confiança.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Mic className="w-6 h-6 text-rose-500" />,
                title: 'Audios de verificacao',
                desc: 'Confirme a autenticidade através de mensagens de voz exclusivas das Sugars.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-rose-500" />,
                title: 'Verificacao completa',
                desc: 'O selo Verificada indica que a identidade foi confirmada com documento.',
              },
              {
                icon: <Video className="w-6 h-6 text-rose-500" />,
                title: 'Revisão da equipa',
                desc: 'Cada perfil é revisto pela equipa da Onesugar antes de ser publicado.',
              },
              {
                icon: <Star className="w-6 h-6 text-rose-500" />,
                title: 'Avaliacoes reais',
                desc: 'Consulte opinioes genuinas de outros clientes sobre cada Sugar.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
              >
                {f.icon}
                <h3 className="font-semibold text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            Como funciona a Onesugar
          </h2>
          <p className="text-base text-muted-foreground text-center mb-10">
            Encontre a sua acompanhante ideal em apenas tres passos simples.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="w-7 h-7 text-rose-500" />,
                step: '1',
                title: 'Escolha o seu distrito',
                desc: 'Selecione a sua localização e descubra as Sugars verificadas disponíveis na sua região. A Onesugar cobre os 18 distritos de Portugal, desde Lisboa e Porto até Bragança e ao Algarve.',
              },
              {
                icon: <UserCheck className="w-7 h-7 text-rose-500" />,
                step: '2',
                title: 'Conheça o perfil da acompanhante',
                desc: 'Explore fotografias autênticas, avaliações reais de outros clientes e todas as informações essenciais. Cada perfil é revisto pela Onesugar antes de ser publicado, e o selo Verificada mostra quem confirmou a identidade. Com segurança e discrição.',
              },
              {
                icon: <MessageCircle className="w-7 h-7 text-rose-500" />,
                step: '3',
                title: 'Entre em contacto directamente',
                desc: 'Contacte a Sugar escolhida de forma totalmente privada e segura. Sem intermediários. A Onesugar não guarda histórico de contactos nem partilha dados pessoais com terceiros.',
              },
            ].map((s, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="bg-rose-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {s.step}
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

      {/* ── REGISTER CTA ── */}
      <section className="py-8 px-6 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold mb-3">
            Seja uma Sugar na Onesugar
          </h2>
          <p className="text-base text-muted-foreground mb-6 leading-relaxed">
            Aumente a sua visibilidade, conquiste clientes e promova-se de
            forma segura. A plataforma com maior crescimento de acompanhantes
            verificadas em Portugal.
          </p>
          <Link
            href="/quanto-ganha-acompanhante"
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
          >
            Registar como Sugar
          </Link>
        </div>
      </section>

      {/* ── WHY CHOOSE ── */}
      <section className="w-full py-4" aria-labelledby="why-choose-heading">
        <div className="container px-4 mx-auto md:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <SectionHeading
                title="Por que escolher a Onesugar?"
                description="A plataforma número um para encontros premium em Portugal com total segurança e discrição."
                centered={false}
              />
              <div className="space-y-4">
                <FeatureItem
                  icon={Shield}
                  title="Verificação exclusiva da Onesugar"
                  description="Todos os perfis são revistos pela equipa, e o selo Verificada indica as Sugars que confirmaram a identidade com documento."
                />
                <FeatureItem
                  icon={MapPin}
                  title="Presença nacional em Portugal"
                  description="Encontre sugars de alto padrão em Lisboa, Porto e nos principais distrito de Portugal."
                />
                <FeatureItem
                  icon={Clock}
                  title="Disponibilidade flexível para acompanhantes"
                  description="Agende encontros que se adaptam à sua rotina, com opções para todos os momentos."
                />
                <FeatureItem
                  icon={Star}
                  title="Avaliações genuínas"
                  description="Acesse avaliações reais de outros clientes sobre cada Sugar."
                />
              </div>
            </div>
            <Image
              src="/selecione-onesugar.png"
              width={800}
              height={800}
              alt="Sugar sofisticada sorrindo para a câmera"
              className="mx-auto aspect-square overflow-hidden rounded-xl object-cover mt-6 lg:mt-0 w-full max-w-[400px] lg:max-w-none"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
            />
          </div>
        </div>
      </section>

      {/* ── REGISTER CTA (below why choose) ── */}
      <section className="py-10 px-6">
        <div className="container mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-rose-100 to-white border border-rose-200 px-8 py-10 text-center space-y-6 dark:from-rose-950/60 dark:to-zinc-900 dark:border-rose-900/30">
          <h2 className="text-2xl font-bold">Junte-se à Onesugar</h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Seja uma Sugar verificada ou encontre a companhia ideal, registe-se agora.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/quanto-ganha-acompanhante"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-7 py-3 rounded-full transition-colors text-sm"
            >
              Registar como Sugar
            </Link>
            <RegistarCliente />
          </div>
        </div>
      </section>

      {/* ── DISTRICT GRID ── */}
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            Acompanhantes Verificadas nos 18 Distritos de Portugal
          </h2>
          <p className="text-base text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            A Onesugar tem perfis activos em todos os distritos de Portugal
            continental. Selecione a sua região e encontre acompanhantes
            verificadas perto de si.
          </p>

          <div className="mb-10">
            <h3 className="text-base font-semibold mb-2 text-rose-500">
              Norte de Portugal
            </h3>
            <p className="text-base text-muted-foreground mb-4 leading-relaxed">
              O norte concentra os dois maiores mercados da plataforma. Porto e
              Braga lideram em volume de perfis activos, com uma oferta
              diversificada que inclui acompanhantes de luxo, escorts
              verificadas e companhia para eventos sociais. Viana do Castelo,
              Bragança e Vila Real completam a cobertura nortenha.
            </p>
            <div className="flex flex-wrap gap-3">
              {districts.norte.map((d) => (
                <Link
                  key={d.slug}
                  href={`/location/${d.slug}`}
                  className="bg-card border border-border hover:border-rose-500 hover:text-rose-500 text-sm px-4 py-2 rounded-full transition-colors"
                >
                  {d.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-base font-semibold mb-2 text-rose-500">
              Centro de Portugal
            </h3>
            <p className="text-base text-muted-foreground mb-4 leading-relaxed">
              Coimbra e Aveiro destacam-se no centro, com Leiria a crescer
              rapidamente pela sua posição entre Lisboa e o norte. A região
              Centro cobre também Viseu, Guarda e Castelo Branco, com perfis
              verificados e disponibilidade actualizada em cada distrito.
            </p>
            <div className="flex flex-wrap gap-3">
              {districts.centro.map((d) => (
                <Link
                  key={d.slug}
                  href={`/location/${d.slug}`}
                  className="bg-card border border-border hover:border-rose-500 hover:text-rose-500 text-sm px-4 py-2 rounded-full transition-colors"
                >
                  {d.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-base font-semibold mb-2 text-rose-500">
              Lisboa, Alentejo e Algarve
            </h3>
            <p className="text-base text-muted-foreground mb-4 leading-relaxed">
              Lisboa tem o maior volume de perfis activos da plataforma,
              seguida de Setúbal que cobre toda a Margem Sul e a Península de
              Setúbal. O Algarve, com destaque para Faro, concentra uma
              procura significativa de visitantes internacionais ao longo de
              todo o ano. Évora, Beja, Portalegre e Santarém completam a
              cobertura a sul.
            </p>
            <div className="flex flex-wrap gap-3">
              {districts.sul.map((d) => (
                <Link
                  key={d.slug}
                  href={`/location/${d.slug}`}
                  className="bg-card border border-border hover:border-rose-500 hover:text-rose-500 text-sm px-4 py-2 rounded-full transition-colors"
                >
                  {d.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-base font-semibold mb-2 text-rose-500">
              Ilhas
            </h3>
            <p className="text-base text-muted-foreground mb-4 leading-relaxed">
              A Madeira é um destino internacional com procura crescente por
              acompanhantes verificadas. A Onesugar tem perfis activos na ilha
              com disponibilidade actualizada.
            </p>
            <div className="flex flex-wrap gap-3">
              {districts.ilhas.map((d) => (
                <Link
                  key={d.slug}
                  href={`/location/${d.slug}`}
                  className="bg-card border border-border hover:border-rose-500 hover:text-rose-500 text-sm px-4 py-2 rounded-full transition-colors"
                >
                  {d.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/location"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-full transition-colors text-sm"
            >
              Ver todos os distritos disponíveis
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 px-6 bg-card/50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-10">
            Perguntas frequentes sobre a Onesugar
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'O que é a Onesugar?',
                a: 'A Onesugar é a plataforma portuguesa de referência para quem procura acompanhantes verificadas em Portugal. Opera nos 18 distritos do país e distingue-se por rever cada perfil antes de o publicar; os perfis com o selo Verificada confirmaram a identidade com documento.',
              },
              {
                q: 'Como funciona a verificação de perfis na Onesugar?',
                a: 'Cada acompanhante passa por verificação de identidade, fotografia actual e disponibilidade confirmada antes de o perfil ser publicado. A plataforma utiliza verificação por audio, video e documentos para garantir autenticidade. Perfis que nao passam na verificação nao sao publicados.',
              },
              {
                q: 'A Onesugar tem acompanhantes verificadas em todo o Portugal?',
                a: 'Sim. A Onesugar tem perfis activos nos 18 distritos de Portugal: Lisboa, Porto, Braga, Coimbra, Aveiro, Faro, Setúbal, Leiria, Santarém, Viana do Castelo, Vila Real, Viseu, Guarda, Castelo Branco, Évora, Beja, Portalegre e Bragança.',
              },
              {
                q: 'É seguro contactar acompanhantes pela Onesugar?',
                a: 'Sim. A Onesugar nao guarda histórico de contactos entre utilizadores e acompanhantes, nem partilha dados pessoais com terceiros. A revisão prévia de cada perfil e o selo Verificada reduzem os riscos associados a portais sem moderação.',
              },
              {
                q: 'Como posso anunciar como acompanhante na Onesugar?',
                a: 'Pode criar o seu perfil em onesugar.pt/companions/register. O processo inclui verificação de identidade e disponibilidade. Apos aprovação, o perfil fica visível na página do distrito correspondente e nos resultados de pesquisa da plataforma.',
              },
            ].map((item, i) => (
              <div key={i} className="border-b border-border pb-5">
                <h3 className="font-semibold text-base mb-2">{item.q}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="py-12 px-6 bg-card/50 text-center">
        <div className="container mx-auto max-w-2xl">
          <h3 className="text-xl font-bold mb-3">
            Pronto para uma experiência inesquecível em Portugal?
          </h3>
          <p className="text-base text-muted-foreground mb-6 leading-relaxed">
            Descubra as acompanhantes mais requintadas de Portugal e viva
            momentos únicos com total discrição. Perfis verificados nos 18
            distritos do país.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/location"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
            >
              Explorar agora
            </Link>
            <Link
              href="/location"
              className="border border-rose-600 text-rose-500 hover:bg-rose-600 hover:text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
            >
              Pesquisar por distrito
            </Link>
          </div>
        </div>
      </section>

      {/* ── SCHEMAS ── */}
      <HomeSchemas />
    </>
  );
}

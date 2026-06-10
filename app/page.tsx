import Link from 'next/link';
import { HeroCarouselWrapper } from '@/components/hero-carousel-wrapper';
import { PlanType } from '@/db/queries/kv';
import {
  ShieldCheck,
  Mic,
  Video,
  Star,
  MapPin,
  UserCheck,
  Clock,
  MessageCircle,
} from 'lucide-react';

// ── Schema JSON-LD ────────────────────────────────────────────────────────────

function HomeSchemas() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Onesugar',
    url: 'https://www.onesugar.pt',
    description:
      'A plataforma de referência para acompanhantes verificadas em Portugal. Perfis reais nos 18 distritos do país.',
    inLanguage: 'pt-PT',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.onesugar.pt/location/{search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
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
          text: 'A Onesugar é a plataforma portuguesa de referência para quem procura acompanhantes verificadas em Portugal. Opera nos 18 distritos do país e distingue-se pelo rigoroso processo de verificação de identidade e disponibilidade antes de publicar qualquer perfil.',
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
          text: 'Sim. A Onesugar não guarda histórico de contactos entre utilizadores e acompanhantes, nem partilha dados pessoais com terceiros. A verificação prévia de todos os perfis elimina os principais riscos associados a portais sem moderação.',
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
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Acompanhantes em Portugal
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Descubra as acompanhantes mais sofisticadas de Portugal com total
          discrição e segurança. Perfis verificados nos 18 distritos do país.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/location"
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Encontrar por distrito
          </Link>
          <Link
            href="/companions/register"
            className="border border-rose-600 text-rose-500 hover:bg-rose-600 hover:text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Registar perfil
          </Link>
        </div>
      </section>

      {/* ── EDITORIAL INTRO ───────────────────────────────────────────────── */}
      <section className="py-10 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Onesugar é a plataforma de referência para quem procura
            acompanhantes verificadas em Portugal. Com presença activa nos 18
            distritos do país, da Linha de Cascais ao Algarve, de Bragança ao
            Alentejo, a plataforma centraliza a oferta com um nível de
            verificação que a maioria dos portais não oferece: identidade
            confirmada, fotografia actual e disponibilidade real antes de
            qualquer publicação.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
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

      {/* ── PREMIUM CAROUSEL ──────────────────────────────────────────────── */}
      <section className="py-8 px-6">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            Sugars Premium
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Descubra as nossas acompanhantes premium verificadas
          </p>
          <HeroCarouselWrapper plans={[PlanType.VIP]} />
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            Recursos exclusivos da Onesugar para acompanhantes em Portugal
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10">
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
                desc: 'Documentos verificados para garantir a sua segurança e tranquilidade.',
              },
              {
                icon: <Video className="w-6 h-6 text-rose-500" />,
                title: 'Videos exclusivos',
                desc: 'Visualize videos de verificacao para confirmar a autenticidade dos perfis.',
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
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            Como funciona a Onesugar
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10">
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
                desc: 'Explore fotografias autênticas, avaliações reais de outros clientes e todas as informações essenciais. Cada perfil foi verificado pela Onesugar antes de ser publicado. Com segurança e discrição.',
              },
              {
                icon: <MessageCircle className="w-7 h-7 text-rose-500" />,
                step: '3',
                title: 'Entre em contacto directamente',
                desc: 'Contacte a Sugar escolhida de forma totalmente privada e segura. Sem intermediários. A Onesugar nao guarda histórico de contactos nem partilha dados pessoais com terceiros.',
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
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ───────────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            Por que escolher a Onesugar?
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10">
            A plataforma de referência para encontros premium em Portugal com
            total segurança e discrição.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <ShieldCheck className="w-6 h-6 text-rose-500" />,
                title: 'Verificacao exclusiva',
                desc: 'Todas as Sugars passam por um rigoroso processo de verificação de identidade, audio e video antes de serem publicadas. Nenhum perfil e publicado sem aprovação.',
              },
              {
                icon: <MapPin className="w-6 h-6 text-rose-500" />,
                title: 'Presenca nacional',
                desc: 'Perfis verificados nos 18 distritos de Portugal. De Lisboa e Porto ao Algarve, do Alentejo a Trás-os-Montes, a Onesugar cobre todo o país.',
              },
              {
                icon: <Clock className="w-6 h-6 text-rose-500" />,
                title: 'Disponibilidade flexivel',
                desc: 'Marque encontros que se adaptam à sua rotina, com opcoes para todos os momentos. Muitos perfis tem disponibilidade imediata ou para o mesmo dia.',
              },
              {
                icon: <Star className="w-6 h-6 text-rose-500" />,
                title: 'Avaliacoes genuinas',
                desc: 'Consulte avaliacoes reais de outros clientes sobre cada Sugar. Transparencia total para que possa escolher com confiança.',
              },
            ].map((r, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
              >
                {r.icon}
                <h3 className="font-semibold text-sm">{r.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISTRICT GRID ────────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">
            Acompanhantes Verificadas nos 18 Distritos de Portugal
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            A Onesugar tem perfis activos em todos os distritos de Portugal
            continental. Selecione a sua região e encontre acompanhantes
            verificadas perto de si.
          </p>

          {/* Norte */}
          <div className="mb-10">
            <h3 className="text-base font-semibold mb-2 text-rose-500">
              Norte de Portugal
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
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

          {/* Centro */}
          <div className="mb-10">
            <h3 className="text-base font-semibold mb-2 text-rose-500">
              Centro de Portugal
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
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

          {/* Sul */}
          <div className="mb-4">
            <h3 className="text-base font-semibold mb-2 text-rose-500">
              Lisboa, Alentejo e Algarve
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-card/50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-10">
            Perguntas frequentes sobre a Onesugar
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'O que é a Onesugar?',
                a: 'A Onesugar é a plataforma portuguesa de referência para quem procura acompanhantes verificadas em Portugal. Opera nos 18 distritos do país e distingue-se pelo rigoroso processo de verificação de identidade e disponibilidade antes de publicar qualquer perfil.',
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
                a: 'Sim. A Onesugar nao guarda histórico de contactos entre utilizadores e acompanhantes, nem partilha dados pessoais com terceiros. A verificação prévia de todos os perfis elimina os principais riscos associados a portais sem moderação.',
              },
              {
                q: 'Como posso anunciar como acompanhante na Onesugar?',
                a: 'Pode criar o seu perfil em onesugar.pt/companions/register. O processo inclui verificação de identidade e disponibilidade. Apos aprovação, o perfil fica visível na página do distrito correspondente e nos resultados de pesquisa da plataforma.',
              },
            ].map((item, i) => (
              <div key={i} className="border-b border-border pb-5">
                <h3 className="font-semibold text-sm mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGISTER CTA ────────────────────────────────────────────────── */}
      <section className="py-14 px-6 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold mb-3">
            Seja uma Sugar na Onesugar
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Aumente a sua visibilidade, conquiste clientes e promova-se de
            forma segura. A plataforma com maior crescimento de acompanhantes
            verificadas em Portugal.
          </p>
          <Link
            href="/companions/register"
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
          >
            Registar como Sugar
          </Link>
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-card/50 text-center">
        <div className="container mx-auto max-w-2xl">
          <h3 className="text-xl font-bold mb-3">
            Pronto para uma experiência inesquecível em Portugal?
          </h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
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

      {/* ── SCHEMAS ─────────────────────────────────────────────────────── */}
      <HomeSchemas />

    </main>
  );
}

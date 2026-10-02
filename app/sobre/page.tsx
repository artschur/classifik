import type { Metadata } from "next"
import { AboutPage } from "@/components/about-page"
import { getLocale } from "@/lib/locale.server"
import { OG_LOCALE, absoluteUrl, pageAlternates } from "@/lib/i18n"

const metadataPt: Metadata = {
  // absolute: a marca já está no início, o template não a repete no fim.
  title: { absolute: 'Sobre a OneSugar | Plataforma de acompanhantes em Portugal' },
  description:
    'Saiba mais sobre a Onesugar, uma plataforma confiável para encontrar acompanhantes verificadas e serviços de acompanhantes premium em Portugal.',
  // Canonical autorreferente. Sem isto a página herda o canonical do
  // layout raiz e declara-se duplicada da homepage.
  alternates: pageAlternates('/sobre', 'pt'),
}

const metadataEn: Metadata = {
  title: { absolute: 'About OneSugar | Verified Escort Platform in Portugal' },
  description:
    'Learn about OneSugar, a Portuguese classifieds platform for verified escorts and companions, built around safety, discretion and real profiles.',
  alternates: pageAlternates('/sobre', 'en'),
  openGraph: {
    title: 'About OneSugar',
    url: absoluteUrl('/sobre', 'en'),
    siteName: 'OneSugar',
    locale: OG_LOCALE.en,
    type: 'website',
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === 'en' ? metadataEn : metadataPt
}

const sobreData = {
  title: "Sobre a OneSugar: Transparência e Qualidade em Portugal",
  intro:
    "Bem-vindo à OneSugar, uma plataforma de classificados que pretende elevar o padrão dos anúncios independentes em Portugal. Mais do que um portal, somos uma plataforma digital onde a segurança, a discrição e a facilidade de utilização se juntam para oferecer a melhor experiência possível no setor.",
  highlightText:
    "Segurança em primeiro lugar: Garantimos um ambiente exclusivo para maiores de 18 anos, focado em perfis reais e processos de verificação para assegurar a total confiança de quem nos visita.",
  features: [
    {
      icon: "lock" as const,
      title: "Discrição Total",
      description:
        "Respeitamos a privacidade de quem utiliza a nossa plataforma e aplicamos medidas de segurança digital rigorosas para proteger os dados.",
    },
    {
      icon: "globe" as const,
      title: "Foco em Portugal",
      description:
        "Conhecemos o mercado local. O portal é otimizado para as regiões e cidades portuguesas, garantindo a máxima relevância geográfica.",
    },
    {
      icon: "zap" as const,
      title: "Interface Moderna",
      description:
        "Esquece os sites pesados e confusos. A OneSugar oferece uma experiência limpa, rápida e intuitiva, focada no que realmente importa.",
    },
    {
      icon: "users" as const,
      title: "Capacitar os Anunciantes",
      description:
        "Disponibilizamos ferramentas de gestão de perfil e de destaque que ajudam a aumentar a visibilidade e o retorno do investimento.",
    },
    {
      icon: "shield" as const,
      title: "Proteger os Utilizadores",
      description:
        "Através de processos de moderação e diretrizes rigorosas, para uma navegação mais segura e fiável.",
    },
    {
      icon: "heart" as const,
      title: "Evoluir Continuamente",
      description:
        "Melhoramos a tecnologia e a experiência de utilização, para que a OneSugar seja rápida, intuitiva e acessível em qualquer dispositivo.",
    },
  ],
  sections: [
    {
      title: "Quem Somos?",
      content:
        "A OneSugar nasceu da necessidade de criar um espaço moderno, intuitivo e, acima de tudo, profissional. Num mercado em constante evolução, posicionamo-nos como um diretório premium, focado em dar voz e visibilidade a anunciantes independentes em todo o território nacional. Não somos uma agência. Somos uma ferramenta tecnológica de alta performance, pensada para que cada anúncio chegue ao seu público de forma direta, eficaz e sem intermediários.",
    },
    {
      title: "A Nossa Missão",
      content:
        "A nossa missão é simples: liderar pela qualidade, não pela quantidade. Trabalhamos diariamente para capacitar os anunciantes, proteger os utilizadores e evoluir continuamente.",
    },
    {
      title: "Compromisso com a Ética",
      content:
        "A OneSugar rege-se pelo cumprimento rigoroso das leis nacionais e europeias, incluindo o RGPD. Promovemos um ambiente de respeito, transparência e segurança, e atuamos firmemente contra qualquer prática que viole os nossos Termos de Utilização ou comprometa a dignidade dos anunciantes.",
    },
  ],
  ctaText: "Criar Conta",
  ctaLink: "/cadastro",
  footer: "OneSugar: anúncios reais, com mais confiança.",
}

const aboutDataEn = {
  title: "About OneSugar: Transparency and Quality in Portugal",
  intro:
    "Welcome to OneSugar, a classifieds platform that sets out to raise the standard of independent listings in Portugal. More than a directory, it is a digital space where safety, discretion and ease of use come together to offer the best possible experience in the sector.",
  highlightText:
    "Safety first: OneSugar is for adults over 18 only, with a focus on real profiles and verification processes so that every visitor can browse with confidence.",
  features: [
    {
      icon: "lock" as const,
      title: "Full discretion",
      description:
        "We respect the privacy of everyone who uses the platform and apply strict digital security measures to protect personal data.",
    },
    {
      icon: "globe" as const,
      title: "Focused on Portugal",
      description:
        "We know the local market. The platform is organised by Portuguese districts and cities, so you always see what is near you.",
    },
    {
      icon: "zap" as const,
      title: "Modern interface",
      description:
        "No heavy, confusing pages. OneSugar is clean, fast and easy to use, so you can focus on what matters.",
    },
    {
      icon: "users" as const,
      title: "Empowering advertisers",
      description:
        "Profile management and featured listing tools help advertisers gain visibility and a better return on their investment.",
    },
    {
      icon: "shield" as const,
      title: "Protecting users",
      description:
        "Moderation processes and strict guidelines make browsing safer and more reliable.",
    },
    {
      icon: "heart" as const,
      title: "Always improving",
      description:
        "We keep improving the technology and the experience, so OneSugar stays fast, intuitive and accessible on any device.",
    },
  ],
  sections: [
    {
      title: "Who we are",
      content:
        "OneSugar was created to offer a modern, intuitive and, above all, professional space. In a market that keeps changing, it positions itself as a premium directory that gives independent advertisers across Portugal a voice and visibility. OneSugar is not an agency. It is a technology platform built so that each listing reaches its audience directly, effectively and with no middleman.",
    },
    {
      title: "Our mission",
      content:
        "Our mission is simple: lead through quality, not quantity. Every day we work to empower advertisers, protect users and keep improving.",
    },
    {
      title: "Commitment to ethics",
      content:
        "OneSugar complies strictly with Portuguese and European law, including the GDPR. We promote an environment of respect, transparency and safety, and act firmly against any practice that breaches our Terms of Use or harms the dignity of advertisers.",
    },
  ],
  ctaText: "Browse verified profiles",
  ctaLink: "/companions",
  footer: "OneSugar: real listings you can trust.",
  locale: "en" as const,
}

export default async function SobrePage() {
  if ((await getLocale()) === 'en') return <AboutPage {...aboutDataEn} />
  return <AboutPage {...sobreData} />
}

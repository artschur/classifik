import type { Metadata } from "next"
import { AboutPage } from "@/components/about-page"

export const metadata: Metadata = {
  title: "Sobre a OneSugar | O Teu Portal de Classificados em Portugal",
  description:
    "Conhece a OneSugar, o portal de referência para anúncios em Portugal. Focamo-nos na discrição, segurança e na melhor experiência para anunciantes e utilizadores.",
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

export default function SobrePage() {
  return <AboutPage {...sobreData} />
}

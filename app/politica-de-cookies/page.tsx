import type { Metadata } from "next"
import { LegalPage } from "@/components/legal-page"
import { getLocale } from "@/lib/locale.server"
import { OG_LOCALE, absoluteUrl, pageAlternates } from "@/lib/i18n"

const metadataPt: Metadata = {
  title: "Política de Cookies",
  description:
    "Sabe como a OneSugar utiliza cookies para melhorar a tua navegação. Aprende a gerir, bloquear ou eliminar cookies no nosso portal de anúncios.",
  // Canonical autorreferente, com a versão inglesa como alternativa.
  alternates: pageAlternates("/politica-de-cookies", "pt"),
}

const metadataEn: Metadata = {
  title: "Cookie Policy",
  description:
    "Find out how OneSugar uses cookies to improve your browsing, and how to manage, block or delete them.",
  alternates: pageAlternates("/politica-de-cookies", "en"),
  openGraph: {
    title: "Cookie Policy | OneSugar",
    url: absoluteUrl("/politica-de-cookies", "en"),
    siteName: "OneSugar",
    locale: OG_LOCALE.en,
    type: "website",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === "en" ? metadataEn : metadataPt
}

const cookiesData = {
  title: "Política de Cookies – OneSugar",
  lastUpdated: "26 de janeiro de 2026",
  intro:
    "Para garantir que a tua navegação no sítio web OneSugar (onesugar.pt) seja o mais eficiente e personalizada possível, utilizamos cookies e tecnologias semelhantes. Esta política explica o que são estas ferramentas, como as utilizamos e como podes geri-las.",
  sections: [
    {
      title: "1. O que são Cookies?",
      content:
        "Cookies são pequenos ficheiros de texto que são descarregados para o teu computador, smartphone ou tablet quando acedes a um sítio web. Eles permitem que o site \"lembre\" as tuas ações e preferências (como login, idioma e outras definições de visualização) durante um determinado período, evitando que tenhas de as configurar repetidamente.",
    },
    {
      title: "2. Como utilizamos os Cookies?",
      content: "A OneSugar utiliza cookies para as seguintes finalidades:",
      subsections: [
        {
          title: "Cookies Estritamente Necessários",
          content:
            "São essenciais para o funcionamento Básico do sítio web. Permitem a navegação e o acesso a áreas seguras (como o painel de anunciante). Sem estes, o serviço de classificados não pode ser prestado corretamente.",
        },
        {
          title: "Cookies de Desempenho e Analíticos",
          content:
            "Ajudam-nos a perceber como os utilizadores interagem com o site, recolhendo informações anónimas sobre as páginas visitadas e o tempo de permanência. Utilizamos estas métricas para melhorar continuamente a OneSugar.",
        },
        {
          title: "Cookies de Funcionalidade",
          content:
            "Permitem que o site se recorde de escolhas anteriores (como o teu nome de utilizador ou a região) para oferecer funcionalidades mais avançadas e personalizadas.",
        },
        {
          title: "Cookies de Publicidade e Segmentação",
          content:
            "São utilizados para apresentar anúncios que sejam mais relevantes para ti e para os teus interesses, além de limitarem a frequência com que vês a mesma publicidade. Estes cookies só são ativados quando autorizados nas preferências de cookies e podes alterar ou retirar o teu consentimento a qualquer momento.",
        },
      ],
    },
    {
      title: "3. Cookies de Terceiros",
      content:
        "Em certas secções, a OneSugar utiliza cookies fornecidos por parceiros de confiança (como o Google Analytics ou ferramentas de automação). Estes terceiros podem instalar cookies para medir a eficácia de serviços externos ou personalizar anúncios fora da nossa plataforma.",
    },
    {
      title: "4. Gestão e Desativação de Cookies",
      content: "Podes controlar e/ou eliminar cookies sempre que desejares. Através das definições do teu navegador, podes:",
      subsections: [
        {
          title: "Ver cookies instalados",
          content: "Ver que cookies tens instalados e eliminá-los um a um ou globalmente.",
        },
        {
          title: "Bloquear cookies de terceiros",
          content: "Bloquear a instalação de cookies de terceiros.",
        },
        {
          title: "Impedir cookies",
          content: "Impedir o carregamento de qualquer cookie (o que poderá afetar o funcionamento da OneSugar).",
        },
      ],
    },
    {
      title: "5. Configurações por Navegador",
      content:
        "Para ajustares as tuas preferências, consulta os manuais oficiais dos principais navegadores: Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge.",
    },
    {
      title: "6. Mais Informações",
      content:
        "A OneSugar reserva-se o direito de atualizar esta política sempre que necessário. Se tiveres dúvidas sobre como gerimos a tua privacidade, podes contactar-nos através do e-mail: onesugar.pt@gmail.com.",
    },
  ],
}

const cookiesDataEn = {
  title: "OneSugar Cookie Policy",
  lastUpdated: "26 January 2026",
  note:
    "This is an English translation of the Portuguese Cookie Policy, provided for convenience. In case of any discrepancy, the Portuguese version prevails.",
  intro:
    "To make your browsing on the OneSugar website (onesugar.pt) as efficient and personalised as possible, we use cookies and similar technologies. This policy explains what these tools are, how we use them and how you can manage them.",
  sections: [
    {
      title: "1. What Are Cookies?",
      content:
        "Cookies are small text files downloaded to your computer, smartphone or tablet when you visit a website. They allow the site to \"remember\" your actions and preferences (such as login, language and other display settings) for a period of time, so you do not have to set them again every time.",
    },
    {
      title: "2. How Do We Use Cookies?",
      content: "OneSugar uses cookies for the following purposes:",
      subsections: [
        {
          title: "Strictly Necessary Cookies",
          content:
            "These are essential for the website to work. They allow navigation and access to secure areas (such as the advertiser dashboard). Without them, the classifieds service cannot be provided properly.",
        },
        {
          title: "Performance and Analytics Cookies",
          content:
            "These help us understand how users interact with the site by collecting anonymous information about the pages visited and the time spent on them. We use these metrics to keep improving OneSugar.",
        },
        {
          title: "Functionality Cookies",
          content:
            "These allow the site to remember previous choices (such as your username or region) in order to offer more advanced and personalised features.",
        },
        {
          title: "Advertising and Targeting Cookies",
          content:
            "These are used to show ads that are more relevant to you and your interests, and to limit how often you see the same advert. They are only activated when allowed in the cookie preferences, and you can change or withdraw your consent at any time.",
        },
      ],
    },
    {
      title: "3. Third-Party Cookies",
      content:
        "In certain sections, OneSugar uses cookies provided by trusted partners (such as Google Analytics or automation tools). These third parties may set cookies to measure the effectiveness of external services or to personalise ads outside our platform.",
    },
    {
      title: "4. Managing and Disabling Cookies",
      content: "You can control and/or delete cookies whenever you wish. Through your browser settings, you can:",
      subsections: [
        {
          title: "See installed cookies",
          content: "See which cookies are installed and delete them one by one or all at once.",
        },
        {
          title: "Block third-party cookies",
          content: "Block third-party cookies from being set.",
        },
        {
          title: "Prevent cookies",
          content: "Prevent any cookie from being set (which may affect how OneSugar works).",
        },
      ],
    },
    {
      title: "5. Browser Settings",
      content:
        "To adjust your preferences, see the official guides for the main browsers: Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge.",
    },
    {
      title: "6. More Information",
      content:
        "OneSugar reserves the right to update this policy whenever necessary. If you have any questions about how we handle your privacy, you can contact us at: onesugar.pt@gmail.com.",
    },
  ],
}

export default async function PoliticaCookiesPage() {
  const locale = await getLocale()
  return locale === "en" ? (
    <LegalPage {...cookiesDataEn} locale="en" />
  ) : (
    <LegalPage {...cookiesData} />
  )
}

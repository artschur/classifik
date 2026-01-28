import type { Metadata } from "next"
import { LegalPage } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Política de Cookies | OneSugar Portugal",
  description:
    "Sabe como a OneSugar utiliza cookies para melhorar a tua navegação. Aprende a gerir, bloquear ou eliminar cookies no nosso portal de anúncios.",
}

const cookiesData = {
  title: "Política de Cookies – OneSugar",
  lastUpdated: "26 de janeiro de 2026",
  intro:
    "Para garantir que a tua navegação no sítio web OneSugar (onesugar.app) seja o mais eficiente e personalizada possível, utilizamos cookies e tecnologias semelhantes. Esta política explica o que são estas ferramentas, como as utilizamos e como podes geri-las.",
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
            "São essenciais para o funcionamento básico do sítio web. Permitem a navegação e o acesso a áreas seguras (como o painel de anunciante). Sem estes, o serviço de classificados não pode ser prestado corretamente.",
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

export default function PoliticaCookiesPage() {
  return <LegalPage {...cookiesData} />
}

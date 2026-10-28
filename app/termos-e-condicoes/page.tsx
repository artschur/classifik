import type { Metadata } from "next"
import { LegalPage } from "@/components/legal-page"
import { getLocale } from "@/lib/locale.server"
import { OG_LOCALE, absoluteUrl, pageAlternates } from "@/lib/i18n"

const metadataPt: Metadata = {
  title: "Termos e Condições de Utilização",
  description:
    "Consulta os Termos e Condições da OneSugar. Conhece as regras, responsabilidades e diretrizes para anunciantes e utilizadores no nosso portal de anúncios em Portugal.",
  // Canonical autorreferente, com a versão inglesa como alternativa.
  alternates: pageAlternates("/termos-e-condicoes", "pt"),
}

const metadataEn: Metadata = {
  title: "Terms and Conditions of Use",
  description:
    "Read the OneSugar Terms and Conditions: the rules, responsibilities and guidelines for advertisers and users of our classifieds platform in Portugal.",
  alternates: pageAlternates("/termos-e-condicoes", "en"),
  openGraph: {
    title: "Terms and Conditions of Use | OneSugar",
    url: absoluteUrl("/termos-e-condicoes", "en"),
    siteName: "OneSugar",
    locale: OG_LOCALE.en,
    type: "website",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === "en" ? metadataEn : metadataPt
}

const termosData = {
  title: "Termos e Condições de Utilização – OneSugar",
  lastUpdated: "28 de outubro de 2026",
  intro:
    "Bem-vindo à OneSugar. Ao aceder ou utilizar o nosso sítio web (onesugar.pt), o utilizador concorda em cumprir e vincular-se aos seguintes Termos e Condições. Recomendamos a leitura atenta antes de utilizar os nossos serviços.",
  sections: [
    {
      title: "1. Aceitação dos Termos",
      content:
        "A OneSugar opera como uma plataforma digital de anúncios/classificados. A OneSugar não presta serviços presenciais, não atua como agência e não é parte em quaisquer acordos, negociações ou interações entre utilizadores. Cada utilizador é o único responsável pelo conteúdo que publica e pelas suas comunicações.",
      subsections: [
        {
          title: "Requisitos de Idade",
          content:
            "Ao utilizar o sítio web, o utilizador declara ter plena capacidade jurídica e ter, no mínimo, 18 anos de idade. É estritamente proibida a utilização por menores. Caso exista suspeita de menoridade, a conta poderá ser suspensa e o respetivo conteúdo removido de imediato.",
        },
      ],
    },
    {
      title: "2. Natureza do Serviço",
      content:
        "O nosso serviço limita-se à disponibilização de espaço publicitário digital para anúncios/classificados de anunciantes independentes. A OneSugar não é uma agência, não mantém qualquer vínculo laboral com os anunciantes e não intervém em transações, pagamentos ou encontros decorrentes dos anúncios publicados. Não garantimos a veracidade, integridade, legalidade, qualidade ou disponibilidade do conteúdo publicado por terceiros.",
      subsections: [
        {
          title: "Tradução dos Anúncios",
          content:
            "Para facilitar a consulta por visitantes de outros países, as descrições dos anúncios podem ser apresentadas em inglês através de tradução automática, revista pela equipa da OneSugar sempre que possível. A tradução pode conter imprecisões. Em caso de divergência, prevalece o texto original escrito pelo anunciante em português.",
        },
      ],
    },
    {
      title: "3. Obrigações do Anunciante",
      content: "Ao publicar um anúncio na OneSugar, o anunciante compromete-se a:",
      subsections: [
        {
          title: "Veracidade",
          content:
            "Fornecer informações rigorosas e atualizadas, sob pena de alteração ou exclusão definitiva da plataforma.",
        },
        {
          title: "Idade e Consentimento",
          content:
            "Garantir que todo o conteúdo e pessoas retratadas são maiores de 18 anos e que existe consentimento explícito para a captação e publicação de imagens/vídeos.",
        },
        {
          title: "Idade do Perfil",
          content:
            "A idade indicada no anúncio deve ser compatível com a idade real e com os dados apresentados durante o processo de verificação. Discrepâncias entre a idade declarada e a idade verificada podem resultar na rejeição ou remoção do anúncio.",
        },
        {
          title: "Originalidade",
          content:
            "Não publicar conteúdo que envolva terceiros sem autorização, incluindo material obtido de outras plataformas sem permissão (proibição de roubo de identidade).",
        },
        {
          title: "Legalidade",
          content: "Não promover atividades ilícitas, violência ou exploração de qualquer natureza.",
        },
      ],
    },
    {
      title: "4. Propriedade Intelectual e Conteúdo",
      content:
        "Todo o design, interface e logótipos da OneSugar são propriedade exclusiva da plataforma, sendo proibida a extração de dados (scraping) ou reprodução sem autorização prévia por escrito. O conteúdo publicado pelos anunciantes é da sua exclusiva responsabilidade. Embora a propriedade do conteúdo pertença ao anunciante, a OneSugar reserva-se o direito de remover ou limitar conteúdos que violem estes Termos e Condições ou a legislação vigente.",
    },
    {
      title: "5. Exclusão de Responsabilidade",
      content: "A OneSugar não poderá ser responsabilizada por:",
      subsections: [
        {
          title: "Conteúdos de Terceiros",
          content: "Incluindo a exatidão, legalidade, atualidade ou qualidade das informações publicadas.",
        },
        {
          title: "Interações e Acordos",
          content:
            "Interações, acordos, encontros, pagamentos ou qualquer transação realizada entre utilizadores, dentro ou fora da plataforma.",
        },
        {
          title: "Incidentes",
          content:
            "Perdas, danos, conflitos, incumprimentos, fraudes, ameaças ou incidentes decorrentes do contacto entre utilizadores.",
        },
        {
          title: "Falhas Técnicas",
          content: "Interrupções temporárias do serviço por motivos de manutenção ou falhas técnicas externas.",
        },
      ],
    },
    {
      title: "6. Pagamentos, Cancelamentos e Reembolsos",
      content:
        "Os pagamentos efetuados para destaques ou créditos são finais e não reembolsáveis em condições normais de utilização. Em caso de erro de cobrança ou falha técnica comprovada do sistema, poderemos proceder ao reembolso ou à reposição do crédito/serviço, conforme aplicável. Anúncios que violem estas diretrizes, os Termos e Condições ou a legislação aplicável serão removidos sem aviso prévio e sem direito a qualquer reembolso.",
    },
    {
      title: "7. Proteção de Dados (RGPD)",
      content:
        "O tratamento de dados pessoais é realizado em estrito cumprimento do Regulamento Geral sobre a Proteção de Dados (RGPD). Consulta a nossa Política de Privacidade para obter todos os detalhes sobre a gestão da tua informação.",
    },
    {
      title: "8. Jurisdição e Lei Aplicável",
      content:
        "Estes termos regem-se pelas leis da República Portuguesa. Para a resolução de qualquer litígio, as partes elegem o foro da comarca da sede da entidade detentora da OneSugar, com renúncia expressa a qualquer outro.",
    },
  ],
}

const termsDataEn = {
  title: "OneSugar Terms and Conditions of Use",
  lastUpdated: "28 October 2026",
  note:
    "This is an English translation of the Portuguese Terms and Conditions, provided for convenience. In case of any discrepancy, the Portuguese version prevails.",
  intro:
    "Welcome to OneSugar. By accessing or using our website (onesugar.pt), you agree to comply with and be bound by the following Terms and Conditions. We recommend reading them carefully before using our services.",
  sections: [
    {
      title: "1. Acceptance of the Terms",
      content:
        "OneSugar operates as a digital classified advertising platform. OneSugar does not provide in-person services, does not act as an agency and is not a party to any agreements, negotiations or interactions between users. Each user is solely responsible for the content they publish and for their communications.",
      subsections: [
        {
          title: "Age Requirements",
          content:
            "By using the website, you declare that you have full legal capacity and are at least 18 years old. Use by minors is strictly prohibited. If there is any suspicion that a user is a minor, the account may be suspended and its content removed immediately.",
        },
      ],
    },
    {
      title: "2. Nature of the Service",
      content:
        "Our service is limited to providing digital advertising space for classified ads placed by independent advertisers. OneSugar is not an agency, has no employment relationship with advertisers and does not take part in any transactions, payments or meetings arising from the published ads. We do not guarantee the accuracy, completeness, legality, quality or availability of content published by third parties.",
      subsections: [
        {
          title: "Translation of Ads",
          content:
            "To make the platform easier to use for visitors from other countries, ad descriptions may be shown in English through automatic translation, reviewed by the OneSugar team whenever possible. Translations may contain inaccuracies. In case of any discrepancy, the original text written by the advertiser in Portuguese prevails.",
        },
      ],
    },
    {
      title: "3. Advertiser Obligations",
      content: "By publishing an ad on OneSugar, the advertiser undertakes to:",
      subsections: [
        {
          title: "Accuracy",
          content:
            "Provide accurate and up-to-date information, failing which the ad may be changed or permanently removed from the platform.",
        },
        {
          title: "Age and Consent",
          content:
            "Ensure that all content and all people shown are over 18 years old and that there is explicit consent for capturing and publishing images and videos.",
        },
        {
          title: "Profile Age",
          content:
            "The age stated in the ad must match the advertiser's real age and the details provided during the verification process. Discrepancies between the declared age and the verified age may result in the ad being rejected or removed.",
        },
        {
          title: "Originality",
          content:
            "Not publish content involving third parties without authorisation, including material taken from other platforms without permission (identity theft is prohibited).",
        },
        {
          title: "Legality",
          content: "Not promote illegal activities, violence or exploitation of any kind.",
        },
      ],
    },
    {
      title: "4. Intellectual Property and Content",
      content:
        "All OneSugar design, interface and logos are the exclusive property of the platform, and data extraction (scraping) or reproduction without prior written authorisation is prohibited. Content published by advertisers is their sole responsibility. Although advertisers own their content, OneSugar reserves the right to remove or restrict content that breaches these Terms and Conditions or the law in force.",
    },
    {
      title: "5. Disclaimer of Liability",
      content: "OneSugar cannot be held liable for:",
      subsections: [
        {
          title: "Third-Party Content",
          content: "Including the accuracy, legality, timeliness or quality of the information published.",
        },
        {
          title: "Interactions and Agreements",
          content:
            "Interactions, agreements, meetings, payments or any transactions between users, on or off the platform.",
        },
        {
          title: "Incidents",
          content:
            "Losses, damages, disputes, breaches, fraud, threats or incidents arising from contact between users.",
        },
        {
          title: "Technical Failures",
          content: "Temporary service interruptions due to maintenance or external technical failures.",
        },
      ],
    },
    {
      title: "6. Payments, Cancellations and Refunds",
      content:
        "Payments made for featured placements or credits are final and non-refundable under normal conditions of use. In the event of a billing error or a proven technical failure of the system, we may refund or restore the credit or service, as applicable. Ads that breach these guidelines, the Terms and Conditions or applicable law will be removed without prior notice and without any right to a refund.",
    },
    {
      title: "7. Data Protection (GDPR)",
      content:
        "Personal data is processed in strict compliance with the General Data Protection Regulation (GDPR). Please see our Privacy Policy for full details on how your information is managed.",
    },
    {
      title: "8. Jurisdiction and Governing Law",
      content:
        "These terms are governed by the laws of the Portuguese Republic. For the resolution of any dispute, the parties choose the courts of the district where the entity that owns OneSugar has its registered office, expressly waiving any other jurisdiction.",
    },
  ],
}

export default async function TermosPage() {
  const locale = await getLocale()
  return locale === "en" ? (
    <LegalPage {...termsDataEn} locale="en" />
  ) : (
    <LegalPage {...termosData} />
  )
}

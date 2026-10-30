import type { Metadata } from "next"
import { LegalPage } from "@/components/legal-page"
import { getLocale } from "@/lib/locale.server"
import { OG_LOCALE, absoluteUrl, pageAlternates } from "@/lib/i18n"

const metadataPt: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Leia a política de privacidade da Onesugar e saiba como protegemos as informações do usuário e garantimos uma navegação segura.',
  // Canonical autorreferente, com a versão inglesa como alternativa.
  alternates: pageAlternates('/politica-de-privacidade', 'pt'),
}

const metadataEn: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the OneSugar Privacy Policy and learn how we collect, use and protect personal data, in line with the GDPR.',
  alternates: pageAlternates('/politica-de-privacidade', 'en'),
  openGraph: {
    title: 'Privacy Policy | OneSugar',
    url: absoluteUrl('/politica-de-privacidade', 'en'),
    siteName: 'OneSugar',
    locale: OG_LOCALE.en,
    type: 'website',
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === 'en' ? metadataEn : metadataPt
}

const privacidadeData = {
  title: "Política de Privacidade – OneSugar",
  lastUpdated: "28 de outubro de 2026",
  intro:
    "Na OneSugar, a privacidade e a segurança dos teus dados pessoais são uma prioridade absoluta. Esta Política de Privacidade explica como recolhemos, utilizamos e protegemos as tuas informações ao utilizares o nosso sítio web (onesugar.pt).",
  sections: [
    {
      title: "1. Responsável pelo Tratamento de Dados",
      content:
        "A entidade responsável pelo tratamento dos dados pessoais recolhidos é a gestão da plataforma OneSugar. Para qualquer questão relacionada com a tua privacidade ou para exercer os teus direitos, contacta-nos através do e-mail: onesugar.pt@gmail.com.",
    },
    {
      title: "2. Dados que Recolhemos",
      content: "Recolhemos informações estritamente necessárias para a prestação dos nossos serviços:",
      subsections: [
        {
          title: "Dados de Anunciantes",
          content:
            "Nome de utilizador, idade, redes sociais, e-mail, número de telefone e localização aproximada.",
        },
        {
          title: "Verificação e Segurança",
          content:
            "Para garantir a integridade da plataforma, poderemos solicitar documentos de identificação e vídeos de verificação. Estes dados são utilizados exclusivamente para fins de segurança e anti-fraude, incluindo a confirmação de que a idade indicada no anúncio corresponde à idade real do anunciante, permanecendo totalmente ocultos do público e de outros utilizadores.",
        },
        {
          title: "Dados de Navegação",
          content: "Tipo de dispositivo e dados recolhidos através de cookies.",
        },
      ],
    },
    {
      title: "3. Finalidade e Base Jurídica",
      content: "O tratamento de dados na OneSugar baseia-se em:",
      subsections: [
        {
          title: "Execução de Contrato",
          content: "Para permitir a criação de conta e publicação de anúncios.",
        },
        {
          title: "Obrigação Legal",
          content:
            "Para cumprir obrigações legais e fiscais aplicáveis e responder a pedidos de autoridades competentes.",
        },
        {
          title: "Interesse Legítimo",
          content:
            "Para garantir a segurança da plataforma, prevenir fraudes, abusos e garantir o cumprimento das regras de utilização.",
        },
        {
          title: "Consentimento",
          content: "No caso de cookies não essenciais ou comunicações de marketing.",
        },
      ],
    },
    {
      title: "4. Partilha de Dados com Terceiros",
      content:
        "A OneSugar não comercializa dados pessoais. A partilha ocorre apenas com fornecedores de serviços (alojamento, processamento de pagamentos, análise de tráfego e tradução automática das descrições dos anúncios, que são enviadas ao Google Cloud Translation para serem apresentadas em inglês). Os nossos fornecedores tratam dados pessoais apenas de acordo com as nossas instruções e para as finalidades aqui descritas. Alguns prestadores podem estar localizados fora do Espaço Económico Europeu; quando aplicável, asseguramos salvaguardas adequadas.",
    },
    {
      title: "5. Conservação dos Dados",
      content:
        "Os dados são mantidos enquanto a conta estiver ativa ou pelo período necessário para a finalidade original. Determinados dados poderão ser conservados por períodos adicionais quando necessário para cumprimento de obrigações legais, resolução de litígios, prevenção de fraude e segurança da plataforma. Os dados de verificação (documentos/vídeo), quando aplicável, são tratados com especial cuidado e conservados apenas pelo tempo necessário para validar e manter a integridade do processo.",
    },
    {
      title: "6. Direitos do Utilizador (RGPD)",
      content: "De acordo com o Regulamento Geral sobre a Proteção de Dados, o utilizador da OneSugar pode solicitar:",
      subsections: [
        {
          title: "Acesso e Retificação",
          content: "Consultar e corrigir os seus dados.",
        },
        {
          title: "Apagar (Esquecimento)",
          content: "Eliminar os seus dados pessoais da plataforma.",
        },
        {
          title: "Limitar o Tratamento",
          content: "Solicitar a limitação do tratamento dos teus dados em determinadas situações.",
        },
        {
          title: "Portabilidade",
          content: "Receber os dados num formato estruturado.",
        },
        {
          title: "Oposição",
          content:
            "Opor-te ao tratamento dos teus dados, quando aplicável, nomeadamente quando baseado em interesse legítimo.",
        },
        {
          title: "Retirar Consentimento",
          content:
            "Quando o tratamento depender do teu consentimento (ex.: marketing/cookies), podes retirá-lo a qualquer momento.",
        },
        {
          title: "Reclamar",
          content: "Apresentar reclamação junto da Comissão Nacional de Proteção de Dados (CNPD).",
        },
      ],
    },
    {
      title: "7. Política de Cookies",
      content:
        "Utilizamos cookies para melhorar a tua experiência. Utilizamos cookies Essenciais, de Análise, de Funcionalidade e de Publicidade/Segmentação. Importa notar que cookies não essenciais só são instalados com o teu consentimento. Para mais informações sobre os cookies que utilizamos e como os gerir, consulta a nossa Política de Cookies.",
    },
    {
      title: "8. Segurança",
      content:
        "A OneSugar utiliza protocolos de encriptação (SSL) e medidas técnicas avançadas para proteger a tua informação contra acessos não autorizados.",
    },
    {
      title: "9. Alterações à Política de Privacidade",
      content:
        "A OneSugar reserva-se o direito de atualizar este documento periodicamente. Recomendamos a consulta regular desta página para estares a par de qualquer alteração.",
    },
  ],
}

const privacyDataEn = {
  title: "OneSugar Privacy Policy",
  lastUpdated: "28 October 2026",
  note:
    "This is an English translation of the Portuguese Privacy Policy, provided for convenience. In case of any discrepancy, the Portuguese version prevails.",
  intro:
    "At OneSugar, the privacy and security of your personal data are an absolute priority. This Privacy Policy explains how we collect, use and protect your information when you use our website (onesugar.pt).",
  sections: [
    {
      title: "1. Data Controller",
      content:
        "The entity responsible for processing the personal data collected is the management of the OneSugar platform. For any question about your privacy, or to exercise your rights, contact us at: onesugar.pt@gmail.com.",
    },
    {
      title: "2. Data We Collect",
      content: "We collect only the information strictly necessary to provide our services:",
      subsections: [
        {
          title: "Advertiser Data",
          content:
            "Username, age, social media accounts, email address, phone number and approximate location.",
        },
        {
          title: "Verification and Security",
          content:
            "To protect the integrity of the platform, we may ask for identity documents and verification videos. This data is used exclusively for security and anti-fraud purposes, including confirming that the age stated in the ad matches the advertiser's real age, and it remains completely hidden from the public and from other users.",
        },
        {
          title: "Browsing Data",
          content: "Device type and data collected through cookies.",
        },
      ],
    },
    {
      title: "3. Purpose and Legal Basis",
      content: "Data processing at OneSugar is based on:",
      subsections: [
        {
          title: "Performance of a Contract",
          content: "To allow you to create an account and publish ads.",
        },
        {
          title: "Legal Obligation",
          content:
            "To comply with applicable legal and tax obligations and to respond to requests from the competent authorities.",
        },
        {
          title: "Legitimate Interest",
          content:
            "To keep the platform secure, prevent fraud and abuse, and ensure compliance with the rules of use.",
        },
        {
          title: "Consent",
          content: "For non-essential cookies or marketing communications.",
        },
      ],
    },
    {
      title: "4. Sharing Data with Third Parties",
      content:
        "OneSugar does not sell personal data. Data is shared only with service providers (hosting, payment processing, traffic analytics and automatic translation of ad descriptions, which are sent to Google Cloud Translation so they can be shown in English). Our providers process personal data only on our instructions and for the purposes described here. Some providers may be located outside the European Economic Area; where applicable, we ensure appropriate safeguards are in place.",
    },
    {
      title: "5. Data Retention",
      content:
        "Data is kept while the account is active or for as long as necessary for its original purpose. Certain data may be kept for longer where necessary to comply with legal obligations, resolve disputes, prevent fraud and keep the platform secure. Verification data (documents and video), where applicable, is handled with special care and kept only for as long as necessary to validate and maintain the integrity of the process.",
    },
    {
      title: "6. Your Rights (GDPR)",
      content: "Under the General Data Protection Regulation, OneSugar users may request:",
      subsections: [
        {
          title: "Access and Rectification",
          content: "To view and correct their data.",
        },
        {
          title: "Erasure (Right to Be Forgotten)",
          content: "To delete their personal data from the platform.",
        },
        {
          title: "Restriction of Processing",
          content: "To restrict the processing of your data in certain situations.",
        },
        {
          title: "Portability",
          content: "To receive their data in a structured format.",
        },
        {
          title: "Objection",
          content:
            "To object to the processing of your data where applicable, in particular when it is based on legitimate interest.",
        },
        {
          title: "Withdrawal of Consent",
          content:
            "Where processing depends on your consent (for example marketing or cookies), you can withdraw it at any time.",
        },
        {
          title: "Complaints",
          content: "To lodge a complaint with the Portuguese Data Protection Authority (CNPD).",
        },
      ],
    },
    {
      title: "7. Cookie Policy",
      content:
        "We use cookies to improve your experience: Essential, Analytics, Functionality and Advertising/Targeting cookies. Non-essential cookies are only set with your consent. For more information about the cookies we use and how to manage them, see our Cookie Policy.",
    },
    {
      title: "8. Security",
      content:
        "OneSugar uses encryption protocols (SSL) and advanced technical measures to protect your information against unauthorised access.",
    },
    {
      title: "9. Changes to this Privacy Policy",
      content:
        "OneSugar reserves the right to update this document from time to time. We recommend checking this page regularly to stay informed of any changes.",
    },
  ],
}

export default async function PoliticaPrivacidadePage() {
  const locale = await getLocale()
  return locale === "en" ? (
    <LegalPage {...privacyDataEn} locale="en" />
  ) : (
    <LegalPage {...privacidadeData} />
  )
}

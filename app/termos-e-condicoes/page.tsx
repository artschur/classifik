import type { Metadata } from "next"
import { LegalPage } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Termos e Condições de Utilização | OneSugar Portugal",
  description:
    "Consulta os Termos e Condições da OneSugar. Conhece as regras, responsabilidades e diretrizes para anunciantes e utilizadores no nosso portal de anúncios em Portugal.",
}

const termosData = {
  title: "Termos e Condições de Utilização – OneSugar",
  lastUpdated: "26 de janeiro de 2026",
  intro:
    "Bem-vindo à OneSugar. Ao aceder ou utilizar o nosso sítio web (onesugar.app), o utilizador concorda em cumprir e vincular-se aos seguintes Termos e Condições. Recomendamos a leitura atenta antes de utilizar os nossos serviços.",
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

export default function TermosPage() {
  return <LegalPage {...termosData} />
}

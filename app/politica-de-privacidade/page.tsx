import type { Metadata } from "next"
import { LegalPage } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Política de Privacidade | OneSugar Portugal",
  description:
    "Sabe como a OneSugar protege os teus dados pessoais. Informações sobre RGPD, recolha de dados e cookies no nosso portal de classificados em Portugal.",
}

const privacidadeData = {
  title: "Política de Privacidade – OneSugar",
  lastUpdated: "27 de janeiro de 2026",
  intro:
    "Na OneSugar, a privacidade e a segurança dos teus dados pessoais são uma prioridade absoluta. Esta Política de Privacidade explica como recolhemos, utilizamos e protegemos as tuas informações ao utilizares o nosso sítio web (onesugar.app).",
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
            "Para garantir a integridade da plataforma, poderemos solicitar documentos de identificação e vídeos de verificação. Estes dados são utilizados exclusivamente para fins de segurança e anti-fraude, permanecendo totalmente ocultos do público e de outros utilizadores.",
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
        "A OneSugar não comercializa dados pessoais. A partilha ocorre apenas com fornecedores de serviços (alojamento, processamento de pagamentos e análise de tráfego). Os nossos fornecedores tratam dados pessoais apenas de acordo com as nossas instruções e para as finalidades aqui descritas. Alguns prestadores podem estar localizados fora do Espaço Económico Europeu; quando aplicável, asseguramos salvaguardas adequadas.",
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

export default function PoliticaPrivacidadePage() {
  return <LegalPage {...privacidadeData} />
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import type { FilterTypesCompanions } from '@/types/types';
import {
  CompanionsList,
  CompanionsListSkeleton,
} from '@/components/companionsList';
import { CompanionFilters } from '@/components/companionFilters';
import Pagination from '@/components/ui/pagination';
import { countCompanionsPages } from '@/db/queries/companions';
import { HeroCarouselWrapper } from '@/components/hero-carousel-wrapper';
import { PlanType } from '@/db/queries/kv';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditorialSection {
  heading?: string;
  paragraphs: string[];
}

interface NearbyLink {
  city: string;
  slug: string;
}

interface CityFAQItem {
  q: string;
  a: string;
}

interface CityData {
  title: string;
  description: string;
  h1: string;
  intro?: string;
  editorial?: {
    mainHeading: string;
    sections: EditorialSection[];
    nearbyLinks: NearbyLink[];
  };
  faq?: CityFAQItem[];
}

// ── Content ───────────────────────────────────────────────────────────────────
// Nota: os títulos NÃO terminam com "| Onesugar".
// O template definido em layout.tsx ('%s | Onesugar') adiciona o sufixo.

const cityMetadata: Record<string, CityData> = {

  // ── Distritos com conteúdo editorial completo ─────────────────────────────

  porto: {
    title: 'Acompanhantes no Porto | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas no Porto. Perfis reais, discrição total e a maior selecção de escorts do norte de Portugal na Onesugar.',
    h1: 'Acompanhantes no Porto',
    intro:
      'O Porto é a segunda maior cidade de Portugal e uma das capitais europeias com maior crescimento turístico da última década. Para quem procura acompanhantes no Porto com perfis verificados e encontros discretos, a Onesugar disponibiliza a maior selecção de companheiras activas na cidade e na área metropolitana. Da Ribeira à Boavista, de Matosinhos ao centro histórico, os perfis da plataforma cobrem as principais zonas do Grande Porto com disponibilidade actualizada. Todos os perfis são verificados antes de qualquer publicação. Navegue pela selecção disponível, filtre por preferência e entre em contacto directamente, sem intermediários.',
    editorial: {
      mainHeading: 'Acompanhantes no Porto: a maior selecção verificada da cidade',
      sections: [
        {
          paragraphs: [
            'O Porto concentra o maior volume de procura por acompanhantes do norte de Portugal, reflexo de uma cidade que combina um tecido urbano activo, turismo internacional em crescimento constante e uma vida nocturna que é referência a nível nacional. A procura por escorts no Porto e por acompanhantes de luxo na cidade tem crescido de forma consistente, acompanhando o perfil cada vez mais diversificado de quem visita e vive aqui.',
            'Na Onesugar, os perfis disponíveis no Porto cobrem diferentes tipos de encontro: companhia para jantares e eventos, encontros privados, e perfis especializados para quem procura experiências específicas. Todos os perfis passaram pelo processo de verificação da plataforma, o que garante que as informações apresentadas são actuais e correspondem à realidade.',
          ],
        },
        {
          heading: 'Por que verificação importa no Porto',
          paragraphs: [
            'A dimensão do mercado portuense atrai também uma quantidade significativa de perfis falsos e anúncios desactualizados noutros portais. Encontrar uma acompanhante no Porto com informação fiável exige, nessa realidade, um nível de triagem que consome tempo e gera frustração. A Onesugar resolve esse problema antes de o utilizador chegar à plataforma: apenas perfis verificados são publicados.',
            'Para quem procura acompanhantes de luxo no Porto para um jantar na Foz, um evento na Boavista ou um encontro privado no centro histórico, a selecção verificada poupa tempo e elimina o risco.',
          ],
        },
        {
          heading: 'O Porto e os visitantes internacionais',
          paragraphs: [
            'A cidade recebe um número crescente de visitantes britânicos, franceses e americanos, muitos dos quais procuram escorts no Porto com disponibilidade para comunicar em inglês. Os perfis da Onesugar incluem acompanhantes com diferentes competências linguísticas, tornando-os adequados tanto para clientes nacionais como para visitantes internacionais.',
            'A plataforma não guarda histórico de contactos nem partilha dados pessoais. A discrição é garantida de ambos os lados.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Braga', slug: 'braga' },
        { city: 'Aveiro', slug: 'aveiro' },
        { city: 'Vila Real', slug: 'vila-real' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes verificadas no Porto?',
        a: 'Na Onesugar, navegue pelos perfis disponíveis no Porto e filtre por tipo de encontro, disponibilidade ou preferência. O contacto é feito directamente com a acompanhante, sem intermediários.',
      },
      {
        q: 'Há escorts no Porto disponíveis para visitantes internacionais?',
        a: 'Sim. A plataforma tem perfis com disponibilidade para comunicar em inglês e outras línguas. Consulte a descrição de cada perfil para confirmar as línguas disponíveis.',
      },
      {
        q: 'A Onesugar tem acompanhantes de luxo no Porto?',
        a: 'Sim. Os perfis verificados do Porto incluem acompanhantes de luxo com experiência em jantares, eventos sociais e encontros privados de alto padrão.',
      },
      {
        q: 'É seguro contactar acompanhantes no Porto através da Onesugar?',
        a: 'A verificação de perfis elimina os riscos mais comuns de portais sem moderação. Os dados pessoais dos utilizadores não são partilhados com terceiros e a navegação pode ser feita sem registo.',
      },
      {
        q: 'Há massagens eróticas disponíveis no Porto na plataforma?',
        a: 'A Onesugar lista diferentes tipos de perfis, incluindo profissionais de massagem sensorial. Consulte a descrição de cada perfil para ver o tipo de serviço disponível.',
      },
    ],
  },

  lisboa: {
    title: 'Acompanhantes em Lisboa | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Lisboa. Perfis reais, escorts de luxo e a maior selecção da capital portuguesa na Onesugar.',
    h1: 'Acompanhantes em Lisboa',
    intro:
      'Lisboa é a capital de Portugal e uma das cidades europeias com maior crescimento de turismo internacional nos últimos anos. Para quem procura acompanhantes em Lisboa com perfis verificados e encontros discretos, a Onesugar disponibiliza a maior selecção de companheiras activas na cidade e na área metropolitana. De Alfama ao Parque das Nações, do Chiado a Cascais, os perfis da plataforma cobrem as principais zonas de Lisboa com disponibilidade actualizada. Todos os perfis são verificados antes de qualquer publicação. Navegue pela selecção disponível, filtre por preferência e entre em contacto directamente, sem intermediários.',
    editorial: {
      mainHeading: 'Acompanhantes em Lisboa: perfis verificados na capital',
      sections: [
        {
          paragraphs: [
            'Lisboa concentra o maior número de perfis activos de toda a plataforma. A diversidade da cidade, com os seus bairros históricos, zonas de negócios, hotéis de luxo e vida nocturna intensa, gera uma procura igualmente diversa: visitantes internacionais em turismo, profissionais em deslocação, e residentes que procuram companhia verificada e discreta.',
            'Para quem procura escorts em Lisboa ou acompanhantes de luxo na cidade, a Onesugar é a plataforma com o processo de verificação mais rigoroso disponível em Portugal. Fotografia actual, disponibilidade confirmada, e dados que correspondem ao que encontra na prática.',
          ],
        },
        {
          heading: 'Lisboa e os visitantes internacionais',
          paragraphs: [
            'Lisboa recebe anualmente milhões de visitantes estrangeiros, e uma parte expressiva desses visitantes procura companhia durante a estadia. A procura por escorts em Lisboa em inglês, francês e outras línguas é significativa, reflectindo o perfil cosmopolita da cidade.',
            'Os perfis da Onesugar em Lisboa incluem acompanhantes com disponibilidade para comunicação em diferentes línguas, tornando a plataforma adequada tanto para clientes nacionais como para quem procura lisbon escorts ou escort lisbon services de qualidade.',
          ],
        },
        {
          heading: 'Acompanhantes de luxo em Lisboa',
          paragraphs: [
            'A cidade tem uma concentração de hotéis de cinco estrelas, restaurantes premiados e espaços privados que criam o contexto ideal para encontros de alto padrão. Os perfis de acompanhantes de luxo em Lisboa disponíveis na Onesugar incluem companheiras com experiência em jantares formais, eventos sociais e encontros privados que exigem um nível de postura e discrição correspondente.',
            'A Onesugar não guarda histórico de contactos entre utilizadores e acompanhantes, nem partilha qualquer dado com terceiros. A navegação pode ser feita sem registo na maioria das funcionalidades.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Setúbal', slug: 'setubal' },
        { city: 'Coimbra', slug: 'coimbra' },
        { city: 'Porto', slug: 'porto' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Lisboa com perfis verificados?',
        a: 'Na Onesugar, todos os perfis listados em Lisboa passaram por verificação de identidade e disponibilidade. Filtre por tipo de encontro, zona e disponibilidade directamente na página.',
      },
      {
        q: 'A Onesugar tem escorts em Lisboa que falam inglês?',
        a: 'Sim. A plataforma tem perfis com disponibilidade para comunicar em inglês e outras línguas. Consulte a descrição de cada perfil para confirmar as línguas disponíveis.',
      },
      {
        q: 'Há acompanhantes de luxo em Lisboa na plataforma?',
        a: 'Sim. Os perfis verificados de Lisboa incluem acompanhantes de luxo com experiência em jantares, eventos formais e encontros privados de alto padrão.',
      },
      {
        q: 'Qual é a melhor zona de Lisboa para um encontro discreto?',
        a: 'Chiado, Príncipe Real e Parque das Nações têm boa oferta hoteleira com privacidade elevada. A escolha depende do perfil e das preferências indicadas por cada acompanhante.',
      },
      {
        q: 'É possível encontrar escort trans em Lisboa através da Onesugar?',
        a: 'Sim. A plataforma tem perfis diversificados em Lisboa, incluindo acompanhantes trans e travestis verificadas. Consulte as opções disponíveis na página de Lisboa.',
      },
    ],
  },

  braga: {
    title: 'Acompanhantes em Braga | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Braga. Perfis reais, discrição total e escorts verificadas na capital do Minho na Onesugar.',
    h1: 'Acompanhantes em Braga',
    intro:
      'Braga é a terceira maior cidade de Portugal e um dos principais centros urbanos do Minho. Conhecida pela sua arquitectura religiosa e pela vibrante comunidade académica da Universidade do Minho, a cidade combina tradição e modernidade de uma forma que poucos centros urbanos portugueses conseguem. Para quem procura acompanhantes em Braga com perfis verificados e encontros discretos, a Onesugar disponibiliza uma selecção activa de companheiras na cidade e na região. Todos os perfis são verificados antes de qualquer publicação. Navegue pelos perfis disponíveis e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Braga: oferta verificada na capital do Minho',
      sections: [
        {
          paragraphs: [
            'Braga ocupa o terceiro lugar no ranking das cidades portuguesas com maior volume de procura por acompanhantes, o que reflecte tanto a sua dimensão urbana como o perfil da sua população. Uma cidade universitária activa, com um centro histórico cada vez mais cosmopolita e uma vida nocturna que se estende pelos bairros da Sé e do centro, Braga tem as condições que sustentam uma procura real e constante.',
            'Na Onesugar, os perfis disponíveis em Braga incluem acompanhantes verificadas com disponibilidade para diferentes tipos de encontro. A verificação de identidade e disponibilidade é feita antes de qualquer perfil ser publicado, garantindo que as informações são reais e actuais.',
          ],
        },
        {
          heading: 'O que diferencia Braga de outras cidades do norte',
          paragraphs: [
            'A dimensão de Braga cria um equilíbrio entre variedade de oferta e discrição natural. A cidade não tem o mesmo nível de anonimato de uma grande metrópole, mas também não tem a exposição de cidades pequenas. Para quem procura acompanhantes de luxo em Braga para um jantar, evento ou encontro privado, os perfis verificados da Onesugar indicam claramente o tipo de companhia disponível e os contactos preferidos.',
          ],
        },
        {
          heading: 'Diversidade de perfis em Braga',
          paragraphs: [
            'A plataforma tem em Braga uma variedade de perfis que inclui acompanhantes femininas, trans verificadas e perfis com diferentes especialidades. Seja qual for a preferência, os filtros da plataforma permitem encontrar rapidamente o perfil mais adequado.',
            'A Onesugar não guarda histórico de contactos nem partilha dados pessoais. A privacidade é garantida de ambos os lados.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Porto', slug: 'porto' },
        { city: 'Viana do Castelo', slug: 'viana-do-castelo' },
        { city: 'Vila Real', slug: 'vila-real' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes verificadas em Braga?',
        a: 'Navegue pelos perfis disponíveis em Braga na Onesugar e filtre por preferência ou disponibilidade. O contacto é feito directamente com a acompanhante, sem intermediários.',
      },
      {
        q: 'A Onesugar tem acompanhantes de luxo em Braga?',
        a: 'Sim. Os perfis verificados de Braga incluem acompanhantes de luxo com experiência em encontros sociais, jantares e momentos privados. A descrição de cada perfil especifica o tipo de companhia disponível.',
      },
      {
        q: 'Há escorts trans disponíveis em Braga na plataforma?',
        a: 'Sim. A Onesugar tem perfis diversificados em Braga, incluindo acompanhantes trans verificadas. Utilize os filtros disponíveis para encontrar o perfil mais adequado.',
      },
      {
        q: 'É seguro contactar acompanhantes em Braga através da Onesugar?',
        a: 'A verificação de perfis elimina os riscos mais comuns de portais sem moderação. Os dados pessoais dos utilizadores não são partilhados com terceiros.',
      },
    ],
  },

  aveiro: {
    title: 'Acompanhantes em Aveiro | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Aveiro. Perfis reais, discrição total e escorts de luxo na Veneza de Portugal na Onesugar.',
    h1: 'Acompanhantes em Aveiro',
    intro:
      'Aveiro é uma das cidades mais singulares de Portugal, conhecida pelos seus canais, pelos barcos moliceiros e pela arquitectura Arte Nova que pontua o seu centro histórico. Para quem procura acompanhantes em Aveiro com perfis verificados, a Onesugar disponibiliza uma selecção activa de companheiras na cidade e na região. Com praias a poucos quilómetros, boa ligação ferroviária ao Porto e a Coimbra, e uma presença universitária activa, Aveiro tem as condições para uma oferta diversificada. Todos os perfis são verificados. Navegue abaixo e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Aveiro: perfis verificados na Veneza de Portugal',
      sections: [
        {
          paragraphs: [
            'Aveiro é frequentemente descrita como a Veneza portuguesa, uma designação que reflecte tanto a beleza dos seus canais como o carácter único que a distingue de qualquer outra cidade do país. Para quem procura acompanhantes em Aveiro ou escorts na região, essa singularidade é também um atributo: a cidade tem uma escala que combina qualidade de oferta com discrição natural.',
            'Na Onesugar, os perfis disponíveis em Aveiro passam por verificação antes de qualquer publicação. A verificação de identidade e disponibilidade é o que garante que o utilizador não perde tempo com perfis falsos ou desactualizados.',
          ],
        },
        {
          heading: 'Aveiro e a região: o que encontra na plataforma',
          paragraphs: [
            'Os perfis de Aveiro na Onesugar incluem acompanhantes verificadas para diferentes tipos de encontro, desde companhia social até encontros mais privados. A plataforma tem também perfis de acompanhantes de luxo em Aveiro para quem procura um padrão mais elevado de companhia e discrição.',
            'A proximidade com a costa, Costa Nova e Mira ficam a menos de 20 minutos, e com cidades como Porto e Coimbra torna Aveiro uma base conveniente para quem se desloca pela região Centro. A Onesugar não guarda histórico de contactos entre utilizadores e acompanhantes, nem partilha dados pessoais com terceiros.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Porto', slug: 'porto' },
        { city: 'Coimbra', slug: 'coimbra' },
        { city: 'Viseu', slug: 'viseu' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Aveiro com perfis verificados?',
        a: 'Na Onesugar, todos os perfis listados em Aveiro passaram por verificação. Filtre por disponibilidade ou preferência directamente na página e contacte sem intermediários.',
      },
      {
        q: 'Há acompanhantes de luxo em Aveiro na plataforma?',
        a: 'Sim. A Onesugar tem perfis de acompanhantes de luxo em Aveiro verificados e com disponibilidade actualizada. Consulte a descrição de cada perfil para ver o tipo de companhia disponível.',
      },
      {
        q: 'Os perfis de acompanhantes em Aveiro são reais?',
        a: 'Sim. Todos os perfis da Onesugar passam por verificação de identidade e disponibilidade antes de serem publicados. Perfis com o selo verificado confirmaram os dados na plataforma.',
      },
      {
        q: 'É seguro contactar escorts em Aveiro através da Onesugar?',
        a: 'A verificação de perfis elimina os principais riscos de portais sem moderação. Os dados dos utilizadores não são partilhados com terceiros e a navegação pode ser feita sem registo.',
      },
    ],
  },

  coimbra: {
    title: 'Acompanhantes em Coimbra | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Coimbra. Perfis reais, acompanhantes de luxo e escorts verificadas na cidade universitária na Onesugar.',
    h1: 'Acompanhantes em Coimbra',
    intro:
      'Coimbra é uma das cidades mais emblemáticas de Portugal, sede da mais antiga universidade do país e palco de uma vida académica que molda a sua identidade há séculos. Para quem procura acompanhantes em Coimbra com perfis verificados e encontros discretos, a Onesugar disponibiliza uma selecção activa de companheiras na cidade e na região. O ambiente singular de Coimbra, com os seus bairros históricos, a Alta Universitária e a zona da Baixa, proporciona um contexto com carácter para qualquer tipo de encontro. Todos os perfis são verificados. Navegue abaixo e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Coimbra: perfis verificados na cidade do conhecimento',
      sections: [
        {
          paragraphs: [
            'Coimbra tem uma identidade que não se encontra em nenhuma outra cidade portuguesa. A Universidade de Coimbra, Património Mundial da UNESCO, o Fado de Coimbra, as suas repúblicas académicas e o ritmo particular da cidade criam um ambiente com personalidade própria. Para quem procura acompanhantes em Coimbra ou acompanhantes de luxo na cidade, esse contexto é parte do que torna os encontros aqui distintos.',
            'Na Onesugar, os perfis disponíveis em Coimbra foram verificados individualmente antes de serem publicados. Isso significa fotografias actuais, disponibilidade confirmada e dados que correspondem ao que encontra na prática.',
          ],
        },
        {
          heading: 'A oportunidade de luxo em Coimbra',
          paragraphs: [
            'Coimbra é frequentemente subestimada como destino para acompanhantes de luxo, mas a realidade do mercado conta uma história diferente. A procura por acompanhantes de luxo em Coimbra é significativa e a concorrência na plataforma é menor do que em Lisboa ou Porto, o que resulta numa relação qualidade-preço mais favorável para quem procura este tipo de perfil.',
            'Para um jantar no centro histórico, um evento na Universidade ou um encontro privado com uma acompanhante verificada de alto padrão, Coimbra oferece opções reais que muitas vezes surpreendem pela qualidade.',
          ],
        },
        {
          heading: 'Coimbra e a região Centro',
          paragraphs: [
            'A posição central de Coimbra no país torna-a também um ponto de passagem frequente entre o norte e o sul. Para quem viaja e procura acompanhantes em Coimbra durante uma estadia, a plataforma tem perfis com disponibilidade tanto durante a semana como ao fim de semana.',
            'A Onesugar não guarda registos de contacto nem partilha dados pessoais com terceiros.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Aveiro', slug: 'aveiro' },
        { city: 'Leiria', slug: 'leiria' },
        { city: 'Viseu', slug: 'viseu' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Coimbra com perfis verificados?',
        a: 'Na Onesugar, todos os perfis listados em Coimbra passaram por verificação de identidade e disponibilidade. Filtre por tipo de encontro, disponibilidade e preferência directamente na página.',
      },
      {
        q: 'Há acompanhantes de luxo em Coimbra disponíveis?',
        a: 'Sim, e com menos concorrência do que em Lisboa ou Porto. A Onesugar tem perfis de acompanhantes de luxo em Coimbra verificados e com disponibilidade actualizada.',
      },
      {
        q: 'Os perfis de acompanhantes em Coimbra são reais?',
        a: 'Sim. Todos os perfis da Onesugar passam por verificação de identidade e disponibilidade antes de serem publicados. O selo verificado confirma que os dados foram validados.',
      },
      {
        q: 'Há escorts disponíveis em Coimbra durante a semana?',
        a: 'Sim. A disponibilidade varia por perfil. Muitos perfis têm disponibilidade durante a semana, especialmente para encontros durante o dia ou à tarde.',
      },
      {
        q: 'A Onesugar tem perfis trans em Coimbra?',
        a: 'Sim. A plataforma tem perfis diversificados em Coimbra, incluindo acompanhantes trans verificadas. Utilize os filtros disponíveis para encontrar o perfil mais adequado.',
      },
    ],
  },

  'viana-do-castelo': {
    title: 'Acompanhantes em Viana do Castelo | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Viana do Castelo. Perfis reais, discrição total e escorts verificadas no Alto Minho na Onesugar.',
    h1: 'Acompanhantes em Viana do Castelo',
    intro:
      'Viana do Castelo é a capital do Alto Minho, uma cidade com uma identidade cultural forte, marcada pela arquitectura minhota, pela romaria da Senhora da Agonia e pela presença do rio Lima a atravessar o seu centro histórico. Para quem procura acompanhantes em Viana do Castelo com perfis verificados e encontros discretos, a Onesugar disponibiliza companheiras activas na cidade e na região. A menor escala urbana de Viana do Castelo é, para muitos utilizadores, um atributo em termos de discrição. Todos os perfis são verificados. Navegue abaixo e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Viana do Castelo: o Alto Minho na Onesugar',
      sections: [
        {
          paragraphs: [
            'Viana do Castelo tem uma posição geográfica que a torna num ponto relevante para quem se desloca entre o Porto e a Galiza, ou para quem vive e trabalha na região do Alto Minho. A cidade tem uma escala humana que combina qualidade de vida com a vitalidade de um centro urbano activo, e essa dimensão é também um factor na procura por acompanhantes em Viana do Castelo.',
            'Na Onesugar, os perfis disponíveis em Viana do Castelo foram verificados antes de qualquer publicação. Para quem procura escorts em Viana do Castelo ou acompanhantes de luxo na região do Minho, a verificação garante que as informações apresentadas são reais e actuais.',
          ],
        },
        {
          heading: 'Viana do Castelo: discrição e contexto',
          paragraphs: [
            'A menor densidade urbana de Viana do Castelo em comparação com Braga ou Porto é frequentemente mencionada como um factor positivo em termos de discrição. O anonimato é mais fácil de preservar numa cidade de escala intermédia, e a oferta hoteleira local, incluindo unidades junto ao rio Lima e na zona da praia do Cabedelo, oferece opções adequadas para encontros privados.',
            'A proximidade com Guimarães e Braga torna Viana do Castelo também um ponto de passagem frequente, com perfis activos que têm disponibilidade para encontros em toda a região. A Onesugar não guarda histórico de contactos nem partilha dados com terceiros.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Braga', slug: 'braga' },
        { city: 'Porto', slug: 'porto' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Viana do Castelo?',
        a: 'Navegue pelos perfis disponíveis em Viana do Castelo na Onesugar, filtre por preferência ou disponibilidade e contacte directamente. Não são necessários intermediários.',
      },
      {
        q: 'Os perfis de acompanhantes em Viana do Castelo são verificados?',
        a: 'Sim. Todos os perfis publicados na Onesugar passam por verificação de identidade e disponibilidade. O selo de verificação confirma que os dados foram validados pela plataforma.',
      },
      {
        q: 'Há acompanhantes de luxo disponíveis em Viana do Castelo?',
        a: 'Sim. A Onesugar tem perfis de acompanhantes de luxo em Viana do Castelo para diferentes tipos de encontro. Consulte a descrição de cada perfil para ver o tipo de companhia disponível.',
      },
      {
        q: 'Viana do Castelo tem hotéis adequados para encontros discretos?',
        a: 'Sim. A cidade tem unidades hoteleiras no centro histórico, junto ao rio Lima e na zona da praia do Cabedelo, com boa privacidade e menor movimento do que nas grandes cidades.',
      },
    ],
  },

  'castelo-branco': {
    title: 'Acompanhantes em Castelo Branco | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Castelo Branco. Perfis reais, discrição total e contacto directo na Onesugar.',
    h1: 'Acompanhantes em Castelo Branco',
    intro:
      'Castelo Branco é a capital da Beira Baixa e um dos centros urbanos mais activos do interior de Portugal. Se está à procura de acompanhantes em Castelo Branco com perfis reais e verificados, a Onesugar é a plataforma com a maior selecção disponível na região. Todos os perfis passam por verificação antes de serem publicados, eliminando os riscos comuns de outras plataformas. Encontros discretos, comunicação directa e total privacidade. Navegue pelos perfis disponíveis abaixo, filtre por preferência e entre em contacto sem intermediários.',
    editorial: {
      mainHeading: 'Acompanhantes em Castelo Branco: o que encontra na Onesugar',
      sections: [
        {
          paragraphs: [
            'A procura por acompanhantes em Castelo Branco tem crescido de forma consistente nos últimos anos, acompanhando o desenvolvimento da cidade como polo regional da Beira Baixa. Com uma população universitária activa, fluxo constante de profissionais em deslocação e uma posição geográfica central no interior do país, a cidade reúne condições para uma oferta diversificada e de qualidade.',
            'Na Onesugar, os perfis disponíveis em Castelo Branco são verificados individualmente antes de serem publicados. Isso significa que as fotografias são actuais, a disponibilidade é real e as informações correspondem ao que encontra na prática.',
          ],
        },
        {
          heading: 'O que diferencia as acompanhantes verificadas da Onesugar',
          paragraphs: [
            'A maioria dos portais de classificados não faz qualquer verificação de identidade. O resultado são perfis falsos, fotos antigas ou números de contacto que nunca respondem. Na Onesugar, o processo de verificação é condição de entrada: quem não passa não fica na plataforma.',
            'Para quem procura escorts em Castelo Branco ou acompanhantes de luxo na região da Beira Baixa, esta diferença é relevante. O tempo que poupa ao não precisar de filtrar perfis suspeitos é tempo que passa a dedicar ao que realmente importa.',
          ],
        },
        {
          heading: 'Discrição e privacidade em Castelo Branco',
          paragraphs: [
            'Todos os encontros marcados através da plataforma ficam exclusivamente entre as partes envolvidas. A Onesugar não guarda histórico de contactos nem partilha dados com terceiros. A navegação pode ser feita sem registo para a maioria das funcionalidades.',
            'Castelo Branco oferece várias zonas tranquilas e discretas para encontros, com boa rede de hotelaria na área central da cidade e nas imediações da zona da Devesa.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Guarda', slug: 'guarda' },
        { city: 'Portalegre', slug: 'portalegre' },
        { city: 'Coimbra', slug: 'coimbra' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes verificadas em Castelo Branco?',
        a: 'Através da Onesugar, navegue pelos perfis disponíveis em Castelo Branco e filtre por disponibilidade ou preferência. O contacto é feito directamente com a acompanhante, sem intermediários.',
      },
      {
        q: 'Os perfis de acompanhantes em Castelo Branco são reais?',
        a: 'Sim. Todos os perfis da Onesugar passam por um processo de verificação de identidade e disponibilidade antes de serem publicados. Perfis com o selo verificado confirmaram os dados na plataforma.',
      },
      {
        q: 'É legal encontrar acompanhantes em Castelo Branco através da Onesugar?',
        a: 'A plataforma opera como portal de classificados para anúncios de acompanhantes em Portugal. A prostituição adulta e consensual não é crime em Portugal. A Onesugar não intermedeia nem facilita exploração sexual, funcionando exclusivamente como espaço de anúncio.',
      },
      {
        q: 'Há escorts disponíveis em Castelo Branco com disponibilidade imediata?',
        a: 'Os perfis activos na plataforma indicam disponibilidade actualizada. Para encontros no próprio dia, filtre por disponibilidade imediata na página de Castelo Branco.',
      },
    ],
  },

  evora: {
    title: 'Acompanhantes em Évora | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Évora. Perfis reais, discrição total e acompanhantes de luxo no coração do Alentejo na Onesugar.',
    h1: 'Acompanhantes em Évora',
    intro:
      'Évora é uma das cidades mais emblemáticas de Portugal, Património Mundial da UNESCO e capital do Alentejo. Para quem procura acompanhantes em Évora com perfis verificados e encontros discretos, a Onesugar disponibiliza uma selecção de companheiras com presença activa na cidade e na região alentejana. O ambiente histórico e tranquilo de Évora, com a sua rede de hotéis de charme no centro medieval, proporciona um contexto ideal para encontros que combinam sofisticação e privacidade. Navegue pelos perfis disponíveis, filtre por preferência e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Évora: sofisticação no coração do Alentejo',
      sections: [
        {
          paragraphs: [
            'A cidade de Évora tem uma identidade própria que não se encontra em mais nenhum ponto do país. As ruelas medievais, o Templo Romano, o aqueduto da Prata e a atmosfera de uma cidade que vive entre a história e a modernidade criam um cenário que poucos ambientes conseguem igualar. Para quem procura acompanhantes de luxo em Évora, esse contexto é parte da experiência.',
            'Na Onesugar, os perfis disponíveis em Évora incluem acompanhantes verificadas com experiência em encontros sociais, jantares e momentos mais privados. A verificação da identidade e disponibilidade é feita antes de qualquer perfil ser publicado, garantindo que o que vê corresponde ao que encontra.',
          ],
        },
        {
          heading: 'Por que Évora é diferente de outras cidades do Alentejo',
          paragraphs: [
            'Évora concentra o maior número de perfis activos do Alentejo. A presença da Universidade de Évora, o fluxo constante de turismo nacional e internacional, e a sua posição como polo administrativo e cultural da região explicam essa diferença.',
            'Para quem visita Évora a negócios ou em turismo e pretende companhia para uma noite, um jantar ou um encontro mais privado, a plataforma oferece escorts em Évora com disponibilidade para diferentes tipos de encontro.',
          ],
        },
        {
          heading: 'Discrição e contexto em Évora',
          paragraphs: [
            'O centro histórico de Évora tem uma concentração de hotéis de charme que proporcionam privacidade real. As pousadas e unidades de turismo rural nos arredores da cidade são outra opção para quem prefere mais isolamento.',
            'A Onesugar não guarda registos de contacto nem partilha dados com terceiros, garantindo privacidade total. A região do Alentejo, com o seu ritmo mais calmo e menor densidade urbana, contribui também para a discrição natural dos encontros.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Beja', slug: 'beja' },
        { city: 'Portalegre', slug: 'portalegre' },
        { city: 'Setúbal', slug: 'setubal' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Évora com perfis verificados?',
        a: 'Na Onesugar, todos os perfis listados em Évora passaram por verificação de identidade. Pode filtrar por disponibilidade, tipo de encontro e preferências directamente na página.',
      },
      {
        q: 'Há acompanhantes de luxo disponíveis em Évora?',
        a: 'Sim. A Onesugar tem perfis de acompanhantes de luxo em Évora com experiência em encontros sociais, jantares e eventos privados. Os perfis verificados indicam claramente o tipo de companhia disponível.',
      },
      {
        q: 'Qual é a melhor zona de Évora para um encontro discreto?',
        a: 'O centro histórico de Évora tem vários hotéis de charme com privacidade elevada. As pousadas nos arredores da cidade são alternativas com ainda mais isolamento. O contexto é definido entre as partes envolvidas.',
      },
      {
        q: 'As escorts em Évora estão disponíveis durante a semana?',
        a: 'A disponibilidade varia por perfil. Consulte a página de cada acompanhante para ver os horários indicados. Muitos perfis têm disponibilidade durante a semana, especialmente para encontros no próprio dia.',
      },
      {
        q: 'A Onesugar opera legalmente em Évora e no Alentejo?',
        a: 'Sim. A Onesugar é um portal de classificados. Em Portugal, a actividade de acompanhante adulta e consensual não é ilegal. A plataforma não intervém nos acordos entre as partes.',
      },
    ],
  },

  'vila-real': {
    title: 'Acompanhantes em Vila Real | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Vila Real. Perfis reais, discrição total e contacto directo na Onesugar.',
    h1: 'Acompanhantes em Vila Real',
    intro:
      'Vila Real é a capital do distrito homónimo no norte de Portugal, porta de entrada para a região de Trás-os-Montes e ponto de referência para quem viaja entre o litoral e o interior nortenho. Para quem procura acompanhantes em Vila Real com perfis reais e verificados, a Onesugar disponibiliza uma selecção actualizada de companheiras na cidade e na região duriense. Todos os perfis são verificados antes de serem publicados. Navegue abaixo, filtre por preferência e contacte directamente, com total discrição.',
    editorial: {
      mainHeading: 'Acompanhantes em Vila Real: oferta verificada no interior norte',
      sections: [
        {
          paragraphs: [
            'Vila Real reúne características que a tornam num ponto activo para a procura de acompanhantes no interior norte de Portugal. A cidade é sede de distrito, tem uma das maiores faculdades da região de Trás-os-Montes, e a sua proximidade com o Vale do Douro atrai um fluxo constante de visitantes, profissionais e turistas de enoturismo.',
            'A procura por escorts em Vila Real e por acompanhantes de luxo na região tem crescido de forma consistente. A Onesugar responde a essa procura com perfis verificados, informações actualizadas e contacto directo sem intermediários.',
          ],
        },
        {
          heading: 'O que esperar dos perfis de Vila Real na Onesugar',
          paragraphs: [
            'Os perfis disponíveis em Vila Real na plataforma foram verificados individualmente: fotografia actual, disponibilidade confirmada, dados correspondentes à realidade. Nenhum perfil fica publicado sem passar pelo processo de verificação da Onesugar.',
            'Para quem procura uma acompanhante de luxo em Vila Real para um jantar, evento social ou encontro privado, os perfis verificados indicam claramente o tipo de companhia disponível e os contactos preferidos.',
          ],
        },
        {
          heading: 'Vila Real e a região: discrição garantida',
          paragraphs: [
            'A menor densidade urbana de Vila Real em comparação com Porto ou Braga é, para muitos utilizadores, um factor positivo em termos de discrição. A cidade tem uma boa oferta hoteleira no centro e nos arredores, com unidades de turismo rural no Vale do Douro a escassos quilómetros.',
            'A Onesugar não guarda histórico de contactos nem partilha qualquer dado de utilização com terceiros. A navegação e o contacto podem ser feitos com total privacidade.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Braga', slug: 'braga' },
        { city: 'Bragança', slug: 'braganca' },
        { city: 'Guarda', slug: 'guarda' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes verificadas em Vila Real?',
        a: 'Navegue pelos perfis disponíveis em Vila Real na Onesugar. Todos os perfis listados passaram por verificação. Pode filtrar por tipo de encontro e disponibilidade directamente na página.',
      },
      {
        q: 'Há escorts em Vila Real disponíveis para encontros no próprio dia?',
        a: 'Alguns perfis indicam disponibilidade imediata. Consulte a disponibilidade actualizada directamente na página de cada acompanhante em Vila Real.',
      },
      {
        q: 'A Onesugar tem acompanhantes de luxo em Vila Real?',
        a: 'Sim. Os perfis verificados de Vila Real incluem acompanhantes com experiência em encontros sociais e privados. A descrição de cada perfil especifica o tipo de companhia disponível.',
      },
      {
        q: 'É seguro contactar acompanhantes em Vila Real através da Onesugar?',
        a: 'A plataforma faz verificação de identidade antes de publicar qualquer perfil, reduzindo significativamente o risco de perfis falsos. Os dados pessoais dos utilizadores não são partilhados com terceiros.',
      },
    ],
  },

  guarda: {
    title: 'Acompanhantes na Guarda | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas na Guarda. Perfis reais, discrição total e contacto directo na Onesugar.',
    h1: 'Acompanhantes na Guarda',
    intro:
      'A Guarda é a cidade mais alta de Portugal, encostada à Serra da Estrela e conhecida pela sua catedral gótica e pelo carácter marcado do interior beirão. Para quem procura acompanhantes na Guarda com perfis verificados e encontros discretos, a Onesugar disponibiliza companheiras activas na cidade e na região. A plataforma verifica todos os perfis antes de os publicar, garantindo que as informações são reais e actuais. Navegue pelos perfis disponíveis e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes na Guarda: perfis verificados na cidade mais alta de Portugal',
      sections: [
        {
          paragraphs: [
            'A Guarda tem uma identidade própria no panorama das cidades do interior português. Capital de distrito, ponto de passagem obrigatório entre o litoral e a fronteira com Espanha, a cidade tem um fluxo de população activa e visitantes que sustenta uma procura real por acompanhantes na Guarda.',
            'Na Onesugar, os perfis disponíveis para a Guarda são verificados antes de qualquer publicação. Isso distingue a plataforma dos portais de classificados genéricos, onde a maioria dos perfis não tem qualquer verificação e onde encontrar uma acompanhante de luxo na Guarda com dados fiáveis é uma questão de sorte.',
          ],
        },
        {
          heading: 'Encontros na Guarda: o que a cidade oferece',
          paragraphs: [
            'A cidade tem uma rede hoteleira funcional no centro histórico e nos arredores, adequada para encontros privados. A menor escala urbana da Guarda é frequentemente referida pelos utilizadores como um factor positivo em termos de discrição, uma vez que o anonimato é mais fácil de preservar do que em grandes centros urbanos.',
            'Para escorts na Guarda ou para acompanhantes disponíveis na região da Beira Interior, a Onesugar centraliza a oferta verificada num único ponto, sem necessidade de navegar por múltiplos portais não moderados.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Castelo Branco', slug: 'castelo-branco' },
        { city: 'Vila Real', slug: 'vila-real' },
        { city: 'Coimbra', slug: 'coimbra' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes na Guarda através da Onesugar?',
        a: 'Consulte os perfis disponíveis na Guarda, filtre por preferência ou disponibilidade. O contacto é feito directamente com a acompanhante, sem intermediários.',
      },
      {
        q: 'Os perfis de acompanhantes na Guarda são verificados?',
        a: 'Sim. Todos os perfis publicados na Onesugar passam por verificação de identidade e disponibilidade. O selo de verificação indica que os dados do perfil foram confirmados pela plataforma.',
      },
      {
        q: 'Há acompanhantes de luxo disponíveis na Guarda?',
        a: 'A Onesugar tem perfis de acompanhantes de luxo na Guarda para diferentes tipos de encontro, incluindo jantares, eventos e momentos privados. A descrição de cada perfil especifica o que está disponível.',
      },
      {
        q: 'A Guarda tem hotéis adequados para encontros discretos?',
        a: 'Sim. A cidade tem unidades hoteleiras no centro histórico e nos arredores com boa privacidade. A menor densidade urbana da Guarda facilita também a discrição nos deslocamentos.',
      },
    ],
  },

  beja: {
    title: 'Acompanhantes em Beja | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Beja. Perfis reais, discrição total e contacto directo no Baixo Alentejo na Onesugar.',
    h1: 'Acompanhantes em Beja',
    intro:
      'Beja é a capital do Baixo Alentejo, uma cidade de ritmo pausado, céu aberto e calor intenso, conhecida pela sua história romana e pelo cenário típico do interior alentejano. Para quem procura acompanhantes em Beja com perfis verificados, a Onesugar disponibiliza companheiras activas na cidade e na região. Todos os perfis presentes na plataforma foram verificados antes de serem publicados, garantindo autenticidade e disponibilidade real. Filtre por preferência e entre em contacto directamente, com total discrição.',
    editorial: {
      mainHeading: 'Acompanhantes em Beja: perfis reais no Baixo Alentejo',
      sections: [
        {
          paragraphs: [
            'Beja tem uma das identidades mais genuínas do interior português. A cidade romana de Pax Julia, o castelo medieval, as ruas de casas caiadas e o silêncio característico do Alentejo criam um ambiente que combina isolamento e aconchego. Para quem procura acompanhantes em Beja ou escorts na região do Baixo Alentejo, esse ambiente é em si mesmo um atributo.',
            'A Onesugar disponibiliza perfis verificados em Beja, o que significa que cada acompanhante listada confirmou identidade e disponibilidade junto da plataforma. Num mercado onde a maioria dos portais publica qualquer anúncio sem qualquer validação, esta diferença é concreta.',
          ],
        },
        {
          heading: 'Encontros em Beja: contexto e privacidade',
          paragraphs: [
            'O ritmo de Beja é diferente do de Lisboa ou Porto. A cidade tem uma escala humana que facilita naturalmente a discrição. Para encontros privados, a hotelaria local oferece opções no centro histórico e nos arredores, com boa relação qualidade-preço e menor movimento do que nos grandes centros.',
            'A Onesugar não guarda registos de contacto entre utilizadores e acompanhantes, nem partilha dados pessoais com terceiros. A privacidade é garantida de ambos os lados.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Évora', slug: 'evora' },
        { city: 'Faro', slug: 'faro' },
        { city: 'Setúbal', slug: 'setubal' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Beja com perfis verificados?',
        a: 'Na Onesugar, consulte os perfis disponíveis em Beja e filtre por disponibilidade ou tipo de encontro. O contacto é feito directamente, sem intermediários.',
      },
      {
        q: 'Os perfis de acompanhantes em Beja são reais?',
        a: 'Sim. A Onesugar verifica identidade e disponibilidade de todos os perfis antes da publicação. O selo de verificação indica que os dados foram confirmados.',
      },
      {
        q: 'É seguro contratar uma acompanhante em Beja através da Onesugar?',
        a: 'A verificação de perfis reduz significativamente o risco de encontros com perfis falsos. Os dados dos utilizadores não são partilhados com terceiros e a navegação pode ser feita sem registo.',
      },
      {
        q: 'Há escorts disponíveis em Beja durante a semana?',
        a: 'Sim. A disponibilidade varia por perfil. Consulte a página de cada acompanhante para ver os horários indicados e a disponibilidade actual.',
      },
    ],
  },

  portalegre: {
    title: 'Acompanhantes em Portalegre | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Portalegre. Perfis reais, discrição total e contacto directo no Alto Alentejo na Onesugar.',
    h1: 'Acompanhantes em Portalegre',
    intro:
      'Portalegre é a capital do Alto Alentejo, encostada à Serra de São Mamede e próxima da fronteira com Espanha. Cidade de escala humana, com um centro histórico bem preservado e uma tradição cultural que inclui a famosa manufactura de tapeçarias, Portalegre reúne condições para encontros discretos e sem pressas. Para quem procura acompanhantes em Portalegre com perfis verificados, a Onesugar disponibiliza companheiras activas na cidade e na região. Todos os perfis são verificados antes de serem publicados. Navegue abaixo e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Portalegre: o Alto Alentejo na Onesugar',
      sections: [
        {
          paragraphs: [
            'Portalegre é, entre as capitais de distrito do interior português, uma das que mantém uma identidade mais própria. A proximidade com Espanha, a Serra de São Mamede e o ritmo característico do Alto Alentejo fazem desta cidade um ponto de passagem e permanência para um perfil de visitante diferente do que se encontra nas grandes cidades costeiras.',
            'Para quem procura acompanhantes de luxo em Portalegre ou escorts na região do Alto Alentejo, a Onesugar centraliza a oferta disponível com uma garantia que outros portais não oferecem: todos os perfis foram verificados antes de serem publicados. Fotografias actuais, disponibilidade confirmada, dados reais.',
          ],
        },
        {
          heading: 'Portalegre: discrição natural de uma cidade de escala humana',
          paragraphs: [
            'A dimensão de Portalegre é, para muitos utilizadores, um dos seus maiores atributos. O anonimato é mais fácil de preservar numa cidade de menor escala, e a hotelaria local oferece opções adequadas para encontros privados.',
            'A fronteira com Espanha torna Portalegre também um ponto de chegada frequente para visitantes que entram pelo lado de Badajoz, contribuindo para um perfil de procura diversificado ao longo do ano.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Castelo Branco', slug: 'castelo-branco' },
        { city: 'Évora', slug: 'evora' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Portalegre?',
        a: 'Navegue pelos perfis disponíveis em Portalegre na Onesugar e filtre por disponibilidade ou preferência. O contacto é feito directamente com a acompanhante.',
      },
      {
        q: 'Os perfis de acompanhantes em Portalegre são verificados?',
        a: 'Sim. Todos os perfis publicados na Onesugar passam por verificação de identidade e disponibilidade. O selo de verificação indica que os dados foram confirmados pela plataforma.',
      },
      {
        q: 'A Onesugar tem acompanhantes de luxo em Portalegre?',
        a: 'Sim. A plataforma tem perfis de acompanhantes de luxo em Portalegre para diferentes tipos de encontro. Consulte a descrição de cada perfil para ver o tipo de companhia disponível.',
      },
      {
        q: 'É seguro contactar acompanhantes em Portalegre pela Onesugar?',
        a: 'A verificação de perfis elimina os riscos mais comuns de portais sem moderação. Os dados dos utilizadores não são partilhados com terceiros e a plataforma não guarda histórico de contactos.',
      },
    ],
  },

  faro: {
    title: 'Acompanhantes em Faro | Perfis Verificados no Algarve',
    description:
      'Encontre acompanhantes verificadas em Faro e no Algarve. Perfis reais, escorts de luxo e discrição total na região mais turística de Portugal na Onesugar.',
    h1: 'Acompanhantes em Faro',
    intro:
      'Faro é a capital do Algarve e o principal centro urbano do sul de Portugal. Para quem procura acompanhantes em Faro e na região do Algarve com perfis verificados, a Onesugar disponibiliza uma selecção activa de companheiras na cidade e nas zonas costeiras da região. O Algarve recebe anualmente milhões de visitantes nacionais e internacionais, e a oferta de escorts no Algarve acompanha esse perfil diversificado de quem visita a região. Todos os perfis são verificados antes de qualquer publicação. Navegue pelos perfis disponíveis, filtre por preferência e entre em contacto directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Faro e no Algarve: a selecção verificada do sul de Portugal',
      sections: [
        {
          paragraphs: [
            'A região do Algarve é, de longe, o destino turístico mais procurado de Portugal. A concentração de visitantes ao longo do ano, com pico nos meses de verão mas com fluxo constante mesmo fora de época, cria uma procura real e diversificada por acompanhantes no Algarve. Faro, como capital da região e sede do único aeroporto internacional do sul, é o ponto de entrada natural para a maioria desses visitantes.',
            'Na Onesugar, os perfis disponíveis em Faro e no Algarve são verificados individualmente antes de serem publicados. Fotografia actual, disponibilidade confirmada e dados reais. A diferença em relação a portais sem moderação é concreta e percebida desde o primeiro contacto.',
          ],
        },
        {
          heading: 'Acompanhantes de luxo no Algarve',
          paragraphs: [
            'A presença de resorts de luxo, vilas privadas e hotéis de cinco estrelas em toda a região do Algarve cria um contexto para uma procura específica: acompanhantes de luxo no Algarve com disponibilidade para encontros de alto padrão, jantares, eventos e companhia social. Os perfis verificados da Onesugar incluem acompanhantes com experiência neste tipo de encontro, com a discrição que esse contexto exige.',
          ],
        },
        {
          heading: 'O Algarve e os visitantes internacionais',
          paragraphs: [
            'A região recebe visitantes britânicos, alemães, irlandeses e escandinavos em grande número, muitos dos quais procuram escorts no Algarve em inglês. A plataforma tem perfis com disponibilidade para comunicação em diferentes línguas, tornando-a adequada tanto para clientes nacionais como para visitantes internacionais.',
            'A Onesugar não guarda histórico de contactos nem partilha dados pessoais com terceiros.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Beja', slug: 'beja' },
        { city: 'Setúbal', slug: 'setubal' },
        { city: 'Évora', slug: 'evora' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes no Algarve com perfis verificados?',
        a: 'Na Onesugar, navegue pelos perfis disponíveis em Faro, que cobre toda a região do Algarve. Todos os perfis passaram por verificação. Filtre por disponibilidade e preferência directamente na página.',
      },
      {
        q: 'Há escorts no Algarve disponíveis fora da época de verão?',
        a: 'Sim. A plataforma tem perfis activos ao longo de todo o ano. A disponibilidade varia por perfil, mas a oferta mantém-se activa fora dos meses de pico.',
      },
      {
        q: 'A Onesugar tem acompanhantes de luxo no Algarve?',
        a: 'Sim. Os perfis verificados incluem acompanhantes de luxo no Algarve com experiência em encontros sociais, jantares e eventos privados de alto padrão.',
      },
      {
        q: 'As escorts em Faro falam inglês?',
        a: 'Muitos perfis têm disponibilidade para comunicar em inglês, dada a natureza internacional da região. Confirme as línguas disponíveis na descrição de cada perfil.',
      },
      {
        q: 'É seguro contactar acompanhantes em Faro através da Onesugar?',
        a: 'A verificação de perfis elimina os riscos mais comuns de portais sem moderação. Os dados dos utilizadores não são partilhados com terceiros e a navegação pode ser feita sem registo.',
      },
    ],
  },

  viseu: {
    title: 'Acompanhantes em Viseu | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Viseu. Perfis reais, discrição total e escorts de luxo na Beira Alta na Onesugar.',
    h1: 'Acompanhantes em Viseu',
    intro:
      'Viseu é a capital do distrito homónimo no coração do país, uma cidade que combina uma identidade cultural rica, um centro histórico bem preservado e uma posição geográfica central entre o litoral e o interior. Para quem procura acompanhantes em Viseu com perfis verificados e encontros discretos, a Onesugar disponibiliza companheiras activas na cidade e na região da Beira Alta. A plataforma verifica todos os perfis antes de os publicar. Navegue pelos perfis disponíveis, filtre por preferência e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Viseu: perfis verificados na Beira Alta',
      sections: [
        {
          paragraphs: [
            'Viseu é frequentemente referida como uma das cidades portuguesas com melhor qualidade de vida. O seu centro histórico, os museus, a proximidade com a região do Dão e a sua escala humana criam um ambiente que atrai residentes, visitantes e profissionais em deslocação. Essa combinação sustenta uma procura real por acompanhantes em Viseu com disponibilidade para diferentes tipos de encontro.',
            'Na Onesugar, os perfis disponíveis em Viseu foram verificados antes de qualquer publicação. Fotografia actual, dados reais, disponibilidade confirmada. Para quem procura escorts em Viseu ou acompanhantes de luxo na região da Beira Alta, este nível de verificação distingue a plataforma de portais sem qualquer triagem.',
          ],
        },
        {
          heading: 'Diversidade de perfis em Viseu',
          paragraphs: [
            'A oferta disponível em Viseu na plataforma inclui acompanhantes verificadas para diferentes preferências, incluindo perfis trans com disponibilidade activa na cidade. Seja qual for a preferência, os filtros disponíveis permitem encontrar rapidamente o perfil mais adequado.',
          ],
        },
        {
          heading: 'Encontros em Viseu: contexto e discrição',
          paragraphs: [
            'Viseu tem uma rede hoteleira funcional no centro e nos arredores, com boa relação qualidade-privacidade. A cidade tem uma escala que facilita a discrição, sem a exposição de uma grande metrópole mas com diversidade de oferta real.',
            'A Onesugar não guarda histórico de contactos nem partilha dados pessoais com terceiros.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Coimbra', slug: 'coimbra' },
        { city: 'Guarda', slug: 'guarda' },
        { city: 'Aveiro', slug: 'aveiro' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Viseu com perfis verificados?',
        a: 'Na Onesugar, navegue pelos perfis disponíveis em Viseu e filtre por disponibilidade ou preferência. O contacto é feito directamente com a acompanhante, sem intermediários.',
      },
      {
        q: 'A Onesugar tem acompanhantes de luxo em Viseu?',
        a: 'Sim. Os perfis verificados de Viseu incluem acompanhantes de luxo para encontros sociais e privados. Consulte a descrição de cada perfil para ver o tipo de companhia disponível.',
      },
      {
        q: 'Há perfis trans disponíveis em Viseu na plataforma?',
        a: 'Sim. A plataforma tem perfis trans verificados em Viseu com disponibilidade activa. Utilize os filtros disponíveis para encontrar o perfil mais adequado.',
      },
      {
        q: 'É seguro contactar escorts em Viseu através da Onesugar?',
        a: 'A verificação de perfis elimina os riscos mais comuns de portais sem moderação. Os dados pessoais dos utilizadores não são partilhados com terceiros.',
      },
    ],
  },

  leiria: {
    title: 'Acompanhantes em Leiria | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Leiria. Perfis reais, acompanhantes de luxo e escorts verificadas no centro de Portugal na Onesugar.',
    h1: 'Acompanhantes em Leiria',
    intro:
      'Leiria é a capital do distrito homónimo e um dos centros urbanos com crescimento mais consistente do centro de Portugal nos últimos anos. Bem posicionada entre Lisboa e Coimbra, com boa ligação rodoviária e ferroviária, a cidade atrai profissionais, estudantes universitários e visitantes que passam pelo litoral centro. Para quem procura acompanhantes em Leiria com perfis verificados e encontros discretos, a Onesugar disponibiliza companheiras activas na cidade e na região. Todos os perfis são verificados antes de qualquer publicação. Navegue pelos perfis disponíveis e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Leiria: oferta verificada no centro do país',
      sections: [
        {
          paragraphs: [
            'A posição geográfica de Leiria torna-a num ponto de passagem natural entre o norte e o sul, entre o litoral e o interior. A cidade é sede de distrito, tem uma universidade activa e recebe um fluxo constante de profissionais e visitantes que se deslocam na região Centro. Esse perfil alimenta uma procura real por acompanhantes em Leiria com disponibilidade para diferentes tipos de encontro.',
            'Na Onesugar, os perfis disponíveis em Leiria passaram por verificação antes de qualquer publicação. Numa cidade de dimensão intermédia, a ausência de verificação noutros portais é especialmente problemática, com muitos perfis abandonados ou falsos. A Onesugar resolve esse problema à entrada.',
          ],
        },
        {
          heading: 'Acompanhantes de luxo em Leiria',
          paragraphs: [
            'Leiria tem uma das procuras mais expressivas por acompanhantes de luxo entre as cidades de dimensão intermédia em Portugal, o que reflecte um perfil de utilizador com exigências claras em termos de qualidade e discrição. Os perfis verificados da Onesugar em Leiria incluem acompanhantes com experiência em encontros sociais, jantares e momentos privados de alto padrão.',
          ],
        },
        {
          heading: 'Leiria e a região: diversidade de oferta',
          paragraphs: [
            'A plataforma tem em Leiria perfis para diferentes preferências, incluindo acompanhantes trans com disponibilidade activa na cidade e arredores. Os filtros disponíveis permitem encontrar rapidamente o perfil mais adequado.',
            'A Onesugar não guarda histórico de contactos nem partilha dados pessoais com terceiros. A discrição é garantida de ambos os lados.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Coimbra', slug: 'coimbra' },
        { city: 'Santarém', slug: 'santarem' },
        { city: 'Aveiro', slug: 'aveiro' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Leiria com perfis verificados?',
        a: 'Na Onesugar, navegue pelos perfis disponíveis em Leiria e filtre por disponibilidade ou tipo de encontro. O contacto é feito directamente com a acompanhante, sem intermediários.',
      },
      {
        q: 'Há acompanhantes de luxo disponíveis em Leiria?',
        a: 'Sim. A Onesugar tem perfis de acompanhantes de luxo em Leiria verificados e com disponibilidade actualizada para jantares, eventos e encontros privados.',
      },
      {
        q: 'A Onesugar tem perfis trans em Leiria?',
        a: 'Sim. A plataforma tem perfis trans verificados em Leiria com disponibilidade activa. Utilize os filtros disponíveis para encontrar o perfil mais adequado.',
      },
      {
        q: 'Há massagens eróticas disponíveis em Leiria na plataforma?',
        a: 'A Onesugar lista diferentes tipos de perfis, incluindo profissionais de massagem sensorial em Leiria. Consulte a descrição de cada perfil para ver o tipo de serviço disponível.',
      },
      {
        q: 'É seguro contactar acompanhantes em Leiria através da Onesugar?',
        a: 'A verificação de perfis elimina os riscos mais comuns de portais sem moderação. Os dados pessoais dos utilizadores não são partilhados com terceiros e a navegação pode ser feita sem registo.',
      },
    ],
  },

  setubal: {
    title: 'Acompanhantes em Setúbal | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Setúbal. Perfis reais, discrição total e escorts verificadas na Margem Sul e Península de Setúbal na Onesugar.',
    h1: 'Acompanhantes em Setúbal',
    intro:
      'O distrito de Setúbal é um dos mais populosos do país e engloba a Margem Sul de Lisboa, a Península de Setúbal e a região da Arrábida. Cidades como Almada, Barreiro, Seixal, Palmela e a própria Setúbal fazem parte de um território com uma identidade própria, a poucos minutos da capital por ponte ou ferry. Para quem procura acompanhantes em Setúbal com perfis verificados e encontros discretos, a Onesugar disponibiliza companheiras activas em toda a região. Todos os perfis são verificados antes de qualquer publicação. Navegue pelos perfis disponíveis e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Setúbal: perfis verificados na Margem Sul e Península de Setúbal',
      sections: [
        {
          paragraphs: [
            'O distrito de Setúbal é muitas vezes subvalorizado como destino para encontros discretos, mas a sua realidade é diferente. Com uma população de mais de 800 mil habitantes, uma localização privilegiada junto ao estuário do Sado e a presença de zonas residenciais de alta qualidade em toda a Península de Setúbal, a região tem uma procura por acompanhantes verificadas que é consistente ao longo do ano.',
            'Na Onesugar, os perfis disponíveis em Setúbal cobrem toda a região, desde Almada e Seixal na Margem Sul até Palmela, Sesimbra e Setúbal cidade. Todos os perfis foram verificados antes de serem publicados, com fotografia actual e disponibilidade confirmada.',
          ],
        },
        {
          heading: 'Setúbal e a proximidade com Lisboa',
          paragraphs: [
            'A ligação rápida entre Setúbal e Lisboa, seja pela Ponte 25 de Abril, pela Ponte Vasco da Gama ou pelo ferry do Seixal, torna o distrito especialmente conveniente para quem trabalha ou visita a capital mas prefere a privacidade de um contexto diferente. Muitos utilizadores que procuram escorts na região de Setúbal valorizam exactamente esse distanciamento discreto da capital.',
            'A Arrábida e as zonas de turismo de natureza nos arredores de Setúbal oferecem também um contexto diferente para encontros que combinam privacidade e ambiente natural. A Onesugar não guarda histórico de contactos nem partilha dados pessoais com terceiros.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Lisboa', slug: 'lisboa' },
        { city: 'Évora', slug: 'evora' },
        { city: 'Beja', slug: 'beja' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Setúbal com perfis verificados?',
        a: 'Na Onesugar, navegue pelos perfis disponíveis em Setúbal, que cobre toda a região incluindo Almada, Seixal, Palmela e Setúbal cidade. Filtre por disponibilidade e contacte directamente.',
      },
      {
        q: 'A Onesugar tem acompanhantes de luxo em Setúbal?',
        a: 'Sim. Os perfis verificados de Setúbal incluem acompanhantes de luxo para jantares, eventos e encontros privados. Consulte a descrição de cada perfil para ver o tipo de companhia disponível.',
      },
      {
        q: 'Posso encontrar acompanhantes em Setúbal perto de Lisboa?',
        a: 'Sim. O distrito de Setúbal inclui Almada e toda a Margem Sul, a poucos minutos de Lisboa por ponte ou ferry. Muitos perfis têm disponibilidade para encontros em toda a área metropolitana.',
      },
      {
        q: 'É seguro contactar escorts em Setúbal através da Onesugar?',
        a: 'A verificação de perfis elimina os principais riscos de portais sem moderação. Os dados dos utilizadores não são partilhados com terceiros e a navegação pode ser feita sem registo.',
      },
    ],
  },

  santarem: {
    title: 'Acompanhantes em Santarém | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Santarém. Perfis reais, discrição total e contacto directo no Ribatejo na Onesugar.',
    h1: 'Acompanhantes em Santarém',
    intro:
      'Santarém é a capital do Ribatejo e uma das cidades históricas mais marcantes do centro de Portugal, conhecida pelos seus miradouros sobre o Tejo, pela sua arquitectura medieval e pela tradição equestre que define a identidade da região. Para quem procura acompanhantes em Santarém com perfis verificados e encontros discretos, a Onesugar disponibiliza companheiras activas na cidade e na região do Ribatejo. A plataforma verifica todos os perfis antes de os publicar, garantindo informações reais e actuais. Navegue pelos perfis disponíveis e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Santarém: perfis verificados no Ribatejo',
      sections: [
        {
          paragraphs: [
            'Santarém tem uma posição geográfica central que a torna num ponto de referência para quem se desloca entre Lisboa e Coimbra, ou entre o litoral e o interior do país. A cidade tem uma dimensão que combina a tranquilidade do interior com a acessibilidade de uma capital de distrito bem ligada às principais artérias do país.',
            'Para quem procura acompanhantes em Santarém ou escorts na região do Ribatejo, a Onesugar centraliza a oferta verificada num único ponto. Todos os perfis foram verificados antes de serem publicados, com fotografia actual, disponibilidade confirmada e dados que correspondem ao que encontra na prática.',
          ],
        },
        {
          heading: 'Santarém: discrição num contexto diferente',
          paragraphs: [
            'A escala de Santarém é, para muitos utilizadores, um atributo em termos de discrição. O anonimato é mais fácil de preservar do que numa grande metrópole, e a rede hoteleira local oferece opções adequadas para encontros privados, tanto no centro histórico como nas zonas periféricas da cidade.',
            'A Onesugar não guarda histórico de contactos nem partilha dados pessoais com terceiros. Todos os encontros ficam exclusivamente entre as partes envolvidas.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Lisboa', slug: 'lisboa' },
        { city: 'Leiria', slug: 'leiria' },
        { city: 'Coimbra', slug: 'coimbra' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Santarém com perfis verificados?',
        a: 'Na Onesugar, consulte os perfis disponíveis em Santarém, filtre por disponibilidade ou tipo de encontro e contacte directamente. Não são necessários intermediários.',
      },
      {
        q: 'Há acompanhantes de luxo disponíveis em Santarém?',
        a: 'Sim. A Onesugar tem perfis de acompanhantes de luxo em Santarém verificados e com disponibilidade actualizada. Consulte a descrição de cada perfil para ver o tipo de companhia disponível.',
      },
      {
        q: 'Os perfis de acompanhantes em Santarém são reais?',
        a: 'Sim. Todos os perfis publicados na Onesugar passam por verificação de identidade e disponibilidade antes de serem publicados.',
      },
      {
        q: 'É seguro contactar acompanhantes em Santarém pela Onesugar?',
        a: 'A verificação de perfis elimina os riscos mais comuns de portais sem moderação. Os dados dos utilizadores não são partilhados com terceiros e a plataforma não guarda histórico de contactos.',
      },
    ],
  },

  braganca: {
    title: 'Acompanhantes em Bragança | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas em Bragança. Perfis reais, discrição total e contacto directo em Trás-os-Montes na Onesugar.',
    h1: 'Acompanhantes em Bragança',
    intro:
      'Bragança é a capital do distrito mais a nordeste de Portugal, conhecida pelo seu castelo medieval, pela Terra Fria transmontana e pela proximidade com Espanha. A cidade tem uma identidade rural e histórica muito própria, num contexto de baixa densidade urbana que oferece privacidade natural. Para quem procura acompanhantes em Bragança com perfis verificados, a Onesugar disponibiliza companheiras activas na cidade e na região de Trás-os-Montes. Todos os perfis são verificados antes de qualquer publicação. Navegue abaixo e contacte directamente.',
    editorial: {
      mainHeading: 'Acompanhantes em Bragança: perfis verificados no nordeste de Portugal',
      sections: [
        {
          paragraphs: [
            'Bragança é uma das capitais de distrito mais remotas do país, encostada à fronteira com Espanha e rodeada pelo Parque Natural de Montesinho. Essa condição geográfica confere à cidade uma identidade única: baixa densidade urbana, privacidade natural elevada e um ritmo de vida tranquilo que valoriza a discrição por defeito.',
            'Para quem procura acompanhantes em Bragança, a principal dificuldade nos portais tradicionais é a escassez de perfis activos com informação fiável. Na Onesugar, os perfis disponíveis foram verificados antes de qualquer publicação, garantindo que as informações são reais e a disponibilidade é confirmada.',
          ],
        },
        {
          heading: 'Bragança e a fronteira com Espanha',
          paragraphs: [
            'A proximidade com Zamora e com a região da Galiza torna Bragança também um ponto de chegada para visitantes que entram pelo lado espanhol, contribuindo para uma procura que não é exclusivamente local. Para quem visita a cidade em trânsito ou em estadia, a plataforma tem perfis com disponibilidade para encontros no próprio dia.',
            'A Onesugar não guarda histórico de contactos nem partilha dados pessoais com terceiros. A privacidade é garantida de ambos os lados.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Vila Real', slug: 'vila-real' },
        { city: 'Porto', slug: 'porto' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Bragança com perfis verificados?',
        a: 'Na Onesugar, navegue pelos perfis disponíveis em Bragança, filtre por disponibilidade ou preferência e contacte directamente com a acompanhante.',
      },
      {
        q: 'Os perfis de acompanhantes em Bragança são reais?',
        a: 'Sim. Todos os perfis publicados na Onesugar passam por verificação de identidade e disponibilidade antes de serem publicados. O selo verificado confirma que os dados foram validados.',
      },
      {
        q: 'Há escorts disponíveis em Bragança com disponibilidade imediata?',
        a: 'Alguns perfis indicam disponibilidade imediata. Consulte a disponibilidade actualizada directamente na página de cada acompanhante.',
      },
      {
        q: 'É seguro contactar acompanhantes em Bragança pela Onesugar?',
        a: 'A verificação de perfis elimina os riscos mais comuns de portais sem moderação. Os dados dos utilizadores não são partilhados com terceiros e a plataforma não guarda histórico de contactos.',
      },
    ],
  },

  // ── Região Autónoma ────────────────────────────────────────────────────────

  madeira: {
    title: 'Acompanhantes na Madeira | Perfis Verificados',
    description:
      'Encontre acompanhantes verificadas na Madeira. Perfis reais, discrição total e escorts de luxo na ilha mais visitada do Atlântico na Onesugar.',
    h1: 'Acompanhantes na Madeira',
    intro:
      'A Madeira é um dos destinos turísticos mais procurados do mundo, conhecida pelo seu clima ameno durante todo o ano, pelas levadas, pelos picos e pela hospitalidade particular da sua gente. Para quem procura acompanhantes na Madeira com perfis verificados e encontros discretos, a Onesugar disponibiliza uma selecção de companheiras com presença activa na ilha. O Funchal, como capital e maior centro urbano, concentra a maioria dos perfis activos, com disponibilidade para encontros na cidade e em toda a ilha. Todos os perfis são verificados antes de qualquer publicação. Navegue pelos perfis disponíveis, filtre por preferência e entre em contacto directamente, sem intermediários.',
    editorial: {
      mainHeading: 'Acompanhantes na Madeira: perfis verificados na pérola do Atlântico',
      sections: [
        {
          paragraphs: [
            'A Madeira recebe anualmente mais de um milhão de visitantes, um número expressivo para uma ilha com cerca de 250 mil habitantes. Esse fluxo constante de turistas nacionais e internacionais, combinado com uma comunidade residente activa e uma vida nocturna centrada no Funchal, cria uma procura real e diversificada por acompanhantes na Madeira ao longo de todo o ano.',
            'Na Onesugar, os perfis disponíveis para a Madeira foram verificados individualmente antes de serem publicados. Fotografia actual, disponibilidade confirmada e dados que correspondem ao que encontra na prática. Numa ilha onde a oferta verificada é ainda mais escassa do que no continente, esta diferença tem um impacto directo na qualidade da experiência.',
          ],
        },
        {
          heading: 'O Funchal e a procura por escorts verificadas',
          paragraphs: [
            'O Funchal concentra a maior parte da actividade turística e urbana da ilha. Os hotéis de cinco estrelas da zona hoteleira, os restaurantes da Zona Velha e o ambiente cosmopolita do centro da cidade criam um contexto adequado para encontros discretos de qualidade. Para quem procura acompanhantes de luxo no Funchal para um jantar, evento social ou encontro privado, os perfis verificados da Onesugar indicam claramente o tipo de companhia disponível e os contactos preferidos.',
            'A ilha tem também zonas mais tranquilas fora do Funchal, como Câmara de Lobos, Machico e a costa norte, onde a privacidade é naturalmente mais elevada. Muitos perfis activos na plataforma têm disponibilidade para se deslocar a diferentes pontos da ilha.',
          ],
        },
        {
          heading: 'A Madeira e os visitantes internacionais',
          paragraphs: [
            'A ilha recebe um número significativo de visitantes britânicos, alemães, escandinavos e do mercado português continental, muitos dos quais procuram escorts na Madeira com disponibilidade para comunicar em inglês. Os perfis da Onesugar para a Madeira incluem acompanhantes com diferentes competências linguísticas, tornando a plataforma adequada tanto para clientes locais como para quem chega de fora.',
            'A Onesugar não guarda histórico de contactos entre utilizadores e acompanhantes, nem partilha qualquer dado com terceiros. A discrição é garantida de ambos os lados.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Lisboa', slug: 'lisboa' },
        { city: 'Porto', slug: 'porto' },
        { city: 'Faro', slug: 'faro' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes verificadas na Madeira?',
        a: 'Na Onesugar, navegue pelos perfis disponíveis para a Madeira e filtre por tipo de encontro, disponibilidade ou preferência. O contacto é feito directamente com a acompanhante, sem intermediários.',
      },
      {
        q: 'Há acompanhantes disponíveis no Funchal?',
        a: 'Sim. A maioria dos perfis activos na Madeira tem base no Funchal, a capital da ilha. Consulte a disponibilidade de cada perfil directamente na página para confirmar a zona de actuação.',
      },
      {
        q: 'A Onesugar tem acompanhantes de luxo na Madeira?',
        a: 'Sim. Os perfis verificados para a Madeira incluem acompanhantes de luxo com experiência em encontros sociais, jantares e eventos privados. A descrição de cada perfil especifica o tipo de companhia disponível.',
      },
      {
        q: 'Há escorts na Madeira que falam inglês?',
        a: 'Sim. Dada a natureza internacional do turismo na ilha, vários perfis têm disponibilidade para comunicar em inglês e outras línguas. Confirme as línguas disponíveis na descrição de cada perfil.',
      },
      {
        q: 'É seguro contactar acompanhantes na Madeira através da Onesugar?',
        a: 'A verificação de perfis elimina os riscos mais comuns de portais sem moderação. Os dados pessoais dos utilizadores não são partilhados com terceiros e a navegação pode ser feita sem registo.',
      },
      {
        q: 'Os perfis de acompanhantes na Madeira são reais?',
        a: 'Sim. Todos os perfis publicados na Onesugar passam por verificação de identidade e disponibilidade antes de serem publicados. O selo verificado confirma que os dados foram validados pela plataforma.',
      },
    ],
  },
};

// ── Static params ─────────────────────────────────────────────────────────────
// Pré-renderiza estaticamente todas as páginas de cidade conhecidas em build
// time. O HTML entregue pelo servidor já contém title, description, robots e
// canonical no <head> desde o primeiro byte, sem depender do RSC streaming.
// Páginas com slugs fora desta lista são renderizadas on-demand (fallback SSR).

export function generateStaticParams() {
  return Object.keys(cityMetadata).map((city) => ({ city }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityKey = city.toLowerCase();
  const capitalizedCity =
    city.charAt(0).toUpperCase() + city.slice(1).replaceAll('-', ' ');

  const current = cityMetadata[cityKey] ?? {
    title: `Acompanhantes em ${capitalizedCity} | Perfis Verificados`,
    description: `Encontre as melhores acompanhantes em ${capitalizedCity}. Perfis verificados, total discrição e segurança na Onesugar.`,
    h1: `Acompanhantes em ${capitalizedCity}`,
  };

  return {
    title: current.title,
    description: current.description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: current.title,
      description: current.description,
      url: `https://www.onesugar.pt/location/${cityKey}`,
      siteName: 'Onesugar',
      locale: 'pt_PT',
      type: 'website',
    },
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LocationH1({ citySlug }: { citySlug: string }) {
  const cityKey = citySlug.toLowerCase();
  const capitalizedCity =
    citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replaceAll('-', ' ');
  const h1Text =
    cityMetadata[cityKey]?.h1 ?? `Acompanhantes em ${capitalizedCity}`;
  return <h1 className="text-3xl font-bold mb-6">{h1Text}</h1>;
}

function CityIntro({ citySlug }: { citySlug: string }) {
  const data = cityMetadata[citySlug.toLowerCase()];
  if (!data?.intro) return null;
  return (
    <p className="mb-8 text-sm text-muted-foreground leading-relaxed max-w-3xl">
      {data.intro}
    </p>
  );
}

function CityEditorialAndFAQ({ citySlug }: { citySlug: string }) {
  const data = cityMetadata[citySlug.toLowerCase()];
  if (!data?.editorial && !data?.faq) return null;

  const faqSchema = data.faq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      }
    : null;

  return (
    <div className="mt-10 mb-6">
      {data.editorial && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-5">
            {data.editorial.mainHeading}
          </h2>
          {data.editorial.sections.map((section, si) => (
            <div key={si} className="mb-5">
              {section.heading && (
                <h3 className="text-base font-semibold mb-2 text-foreground">
                  {section.heading}
                </h3>
              )}
              {section.paragraphs.map((para, pi) => (
                <p
                  key={pi}
                  className="text-sm text-muted-foreground leading-relaxed mb-3"
                >
                  {para}
                </p>
              ))}
            </div>
          ))}
          {data.editorial.nearbyLinks.length > 0 && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              Se está a explorar outras opções em Portugal, encontra também
              perfis activos em{' '}
              {data.editorial.nearbyLinks.map((link, idx) => (
                <span key={link.slug}>
                  <Link
                    href={`/location/${link.slug}`}
                    className="text-rose-500 hover:underline"
                  >
                    {link.city}
                  </Link>
                  {idx < data.editorial!.nearbyLinks.length - 2
                    ? ', '
                    : idx === data.editorial!.nearbyLinks.length - 2
                    ? ' e '
                    : '.'}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
      {data.faq && data.faq.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-5">Perguntas frequentes</h2>
          <div className="space-y-5">
            {data.faq.map((item, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-semibold mb-1 text-foreground">
                  {item.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
          {faqSchema && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── CTA helpers ───────────────────────────────────────────────────────────────

// Retorna a preposição + nome da cidade exactamente como aparece no H1,
// sem o prefixo "Acompanhantes". Ex.: "na Madeira", "no Porto", "em Lisboa".
// Usado nos CTAs para evitar "em Madeira" ou "em Guarda" gramaticalmente errados.
function getCityLabel(citySlug: string): string {
  const data = cityMetadata[citySlug.toLowerCase()];
  if (data?.h1) {
    return data.h1.replace(/^Acompanhantes\s+/i, '').trim();
  }
  return (
    citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replaceAll('-', ' ')
  );
}

// CTA Posicao 1 - entre os perfis e o bloco editorial
function RegistrationCTAInline({ citySlug }: { citySlug: string }) {
  const cityLabel = getCityLabel(citySlug);
  return (
    <div className="my-10 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/10 dark:bg-rose-950/20 dark:border-rose-900/60 px-6 py-5">
      <p className="font-semibold text-sm mb-1">
        Trabalhas como acompanhante {cityLabel}?
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        Regista o teu perfil e aparece para milhares de utilizadores
        verificados.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/checkout"
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          Registar perfil gratuito
        </Link>
        <Link
          href="/plans"
          className="border border-rose-600 text-rose-500 hover:bg-rose-600 hover:text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          Ver planos
        </Link>
      </div>
    </div>
  );
}

// CTA Posicao 2 - apos o FAQ, antes da paginacao
function RegistrationCTABottom({ citySlug }: { citySlug: string }) {
  const cityLabel = getCityLabel(citySlug);
  return (
    <div className="my-10 rounded-2xl border-2 border-dashed border-rose-500 bg-rose-50/10 dark:bg-rose-950/20 px-6 py-7 text-center">
      <p className="font-semibold mb-1">
        Queres anunciar {cityLabel}? Junta-te à Onesugar.
      </p>
      <p className="text-sm text-muted-foreground mb-5">
        Perfil verificado, visibilidade imediata, planos a partir de €0.
      </p>
      <Link
        href="/checkout"
        className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-semibold px-7 py-3 rounded-full transition-colors text-sm"
      >
        Quero registar-me como acompanhante
      </Link>
    </div>
  );
}

async function PaginationComponent({
  location,
  filters,
  limit,
}: {
  location: string;
  filters: FilterTypesCompanions;
  limit: number;
}) {
  const totalPages = await countCompanionsPages(location, limit, filters);
  return <Pagination totalPages={totalPages} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CompanionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<FilterTypesCompanions>;
}) {
  const [{ city }, sParams] = await Promise.all([params, searchParams]);
  const page = parseInt(sParams.page ?? '1', 10);

  return (
    <div className="container mx-auto px-10 py-8">
      <LocationH1 citySlug={city} />

      <div className="mb-4 text-sm text-muted-foreground flex gap-2">
        Explorar:
        <Link href="/location/lisboa" className="hover:underline text-rose-500">
          Lisboa
        </Link>{' '}
        |
        <Link href="/location/porto" className="hover:underline text-rose-500">
          Porto
        </Link>{' '}
        |
        <Link href="/location/braga" className="hover:underline text-rose-500">
          Braga
        </Link>
      </div>

      {/* Posicao 1: Intro - acima do carrossel */}
      <CityIntro citySlug={city} />

      <div className="mb-8">
        <HeroCarouselWrapper citySlug={city} plans={[PlanType.VIP]} />
      </div>

      <CompanionFilters initialFilters={sParams} />
      <Suspense
        key={JSON.stringify(sParams)}
        fallback={<CompanionsListSkeleton />}
      >
        <CompanionsList location={city} page={page} filters={sParams} />
      </Suspense>

      {/* CTA 1 - entre perfis e editorial */}
      <RegistrationCTAInline citySlug={city} />

      {/* Posicao 2: Editorial + FAQ - abaixo dos perfis */}
      <CityEditorialAndFAQ citySlug={city} />

      {/* CTA 2 - apos FAQ, antes da paginacao */}
      <RegistrationCTABottom citySlug={city} />

      <Suspense
        key={JSON.stringify(sParams) + '-pagination'}
        fallback={
          <div className="z-20 fixed bottom-4 min-h-14 min-w-36 left-1/2 transform -translate-x-1/2 bg-stone-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg" />
        }
      >
        <PaginationComponent location={city} filters={sParams} limit={5} />
      </Suspense>
    </div>
  );
}
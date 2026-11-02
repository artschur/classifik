import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isUserACompanion } from '@/db/queries/companions';
import { acessoAPlanos } from '@/db/queries/verificacao';
import { isAdmin } from '@/components/header';
import { ProductCard } from './productCard';
import { LocaleLink } from '@/components/locale-link';
import { getLocale } from '@/lib/locale.server';
import { localizeHref, type Locale } from '@/lib/i18n';
import {
  BASIC_PRICE_ID,
  hasActiveAd,
  PLUS_PRICE_ID,
  VIP_PRICE_ID,
} from '@/db/queries/kv';

export interface Product {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  price: string;
}

const products: Product[] = [
  {
    id: BASIC_PRICE_ID, // Replace with your new recurring price ID
    name: 'Classico',
    description:
      'Presença estratégica com recursos essenciais para se destacar. Assinatura mensal',
    benefits: [
      'Destaque na listagem do distrito escolhida',
      'Exibição antes dos anúncios gratuitos',
      'Aparece no carrossel da página de localização do distrito',
      'Selo "CLÁSSICO" no perfil',
      'Suporte via sistema de atendimento prioritário',
    ],
    price: '€40.00',
  },
  {
    id: PLUS_PRICE_ID, // Replace with your new recurring price ID
    name: 'Plus',
    description:
      'Mais visibilidade e prioridade para o seu perfil. Assinatura mensal.',
    benefits: [
      'Posição de maior destaque no distrito escolhida',
      'Prioridade nas buscas (acima de anúncios Clássico e Gratuito)',
      'Listagem acima dos perfis do plano Clássico',

      'Selo "PLUS" visível no seu perfil',
      'Suporte com atendimento prioritário',
      'Acesso à lista de bloqueios/clientes indesejados',
      'Anúncio principal com mais chances de visualização',
    ],
    price: '€45.00',
  },
  {
    id: VIP_PRICE_ID, // Replace with your new recurring price ID
    name: 'VIP',
    description:
      'Máximo destaque e prioridade total para o seu perfil. Assinatura mensal.',
    benefits: [
      'Destaque absoluto no seu distrito',
      'Prioridade máxima nos resultados de busca',
      'Posição preferencial na seção de visitas por distrito',
      'Listado antes de todos os perfis do site',
      'Aparece no carrossel da página de localização da distrito',
      'Visibilidade superior aos planos Clássico e Plus',
      'Selo "VIP" exclusivo no seu perfil',
      'Possibilidade de gravar um áudio de apresentação',
      'Suporte premium com atendimento dedicado',
      'Acesso completo à lista de bloqueios/clientes indesejados',
      'Máxima exposição na plataforma',
    ],
    price: '€50.00',
  },
];

// Os mesmos planos, com o texto em inglês. Ids e preços iguais aos de cima.
const productsEn: Product[] = [
  {
    id: BASIC_PRICE_ID,
    name: 'Classic',
    description:
      'A strategic presence with the essential features to stand out. Monthly subscription.',
    benefits: [
      'Featured in the listing for your chosen district',
      'Shown before free listings',
      'Appears in the carousel on your district page',
      '"CLASSIC" badge on your profile',
      'Support through our priority help desk',
    ],
    price: '€40.00',
  },
  {
    id: PLUS_PRICE_ID,
    name: 'Plus',
    description:
      'More visibility and priority for your profile. Monthly subscription.',
    benefits: [
      'A more prominent position in your chosen district',
      'Priority in searches (above Classic and free listings)',
      'Listed above Classic plan profiles',
      '"PLUS" badge visible on your profile',
      'Priority support',
      'Access to the block list for unwanted clients',
      'Your main listing gets a better chance of being seen',
    ],
    price: '€45.00',
  },
  {
    id: VIP_PRICE_ID,
    name: 'VIP',
    description:
      'Maximum visibility and top priority for your profile. Monthly subscription.',
    benefits: [
      'Top spot in your district',
      'Highest priority in search results',
      'Preferred position in the visits by district section',
      'Listed before every other profile on the site',
      'Appears in the carousel on your district page',
      'More visibility than the Classic and Plus plans',
      'Exclusive "VIP" badge on your profile',
      'Option to record an audio introduction',
      'Premium support with dedicated assistance',
      'Full access to the block list for unwanted clients',
      'Maximum exposure on the platform',
    ],
    price: '€50.00',
  },
];

const PRODUCTS: Record<Locale, Product[]> = { pt: products, en: productsEn };

const TEXT = {
  pt: {
    titulo: 'Selecione seu Anúncio',
    intro:
      'Escolha o seu anúncio. Após o pagamento, seu perfil será visível no topo do seu distrito, atraindo mais clientes.',
    mesGratis:
      'Na escolha de um plano, o primeiro mês é grátis (apenas para as 15 primeiras sugars)',
    cancele: 'Cancele quando quiser!',
    semSeloTitulo: 'Para escolher um plano, verifique primeiro o seu perfil.',
    semSeloTexto:
      'Os planos são só para perfis com o selo "Verificada". Envie o vídeo e o documento: assim que a equipa confirmar, pode escolher o plano aqui.',
    semSeloBotao: 'Verificar o meu perfil',
    revisaoTitulo: 'O seu perfil está em revisão.',
    revisaoTexto: 'Pode escolher um plano assim que a equipa o voltar a aprovar.',
    semPerfilTitulo: 'Ainda não tem perfil criado.',
    semPerfilTexto:
      'Um plano serve para destacar o seu anúncio, por isso é preciso ter o anúncio primeiro. Veja aqui os preços à vontade e crie o perfil quando decidir: depois volta e escolhe o plano.',
    semPerfilBotao: 'Criar o meu perfil',
  },
  en: {
    titulo: 'Choose your plan',
    intro:
      'Choose your plan. Once you have paid, your profile will appear at the top of your district, bringing you more clients.',
    mesGratis:
      'When you choose a plan, the first month is free (only for the first 15 companions)',
    cancele: 'Cancel anytime!',
    semSeloTitulo: 'To choose a plan, verify your profile first.',
    semSeloTexto:
      'Plans are only for profiles with the "Verified" badge. Send your video and document: as soon as the team confirms them, you can choose your plan here.',
    semSeloBotao: 'Verify my profile',
    revisaoTitulo: 'Your profile is under review.',
    revisaoTexto: 'You can choose a plan as soon as the team approves it again.',
    semPerfilTitulo: 'You have not created a profile yet.',
    semPerfilTexto:
      'A plan makes your listing stand out, so you need the listing first. Feel free to look at the prices here and create your profile when you are ready: then come back and choose your plan.',
    semPerfilBotao: 'Create my profile',
  },
} as const;

export default async function CheckoutPage() {
  // A tabela de preços é informação de quem anuncia: quem procura
  // acompanhante não tem motivo para a ver. Daí a página ter deixado de ser
  // pública e fechar-se a quem escolheu "Sou Cliente".
  //
  // O teste é contra `false` e não a favor de `true` de propósito. Exigir a
  // marca de anunciante fechava a porta a contas legítimas que não a têm:
  // perfis criados antes desse passo existir, e contas com plano e cliente
  // Stripe nos metadados cujo perfil foi entretanto apagado. Bloquear apenas
  // quem se declarou cliente cumpre o mesmo objectivo sem esse risco.
  //
  // A verificação fica aqui e não só no proxy porque o proxy deixa passar
  // qualquer sessão autenticada nas rotas protegidas, sem distinguir cliente
  // de anunciante.
  const locale = await getLocale();
  const t = TEXT[locale];
  const { userId, sessionClaims } = await auth();
  if (sessionClaims?.metadata?.isCompanion === false) {
    redirect(localizeHref('/location', locale));
  }

  // Os preços ficam à vista mesmo sem perfil: é informação que ela precisa
  // para decidir se vale a pena investir o tempo do registo. O que não pode
  // acontecer é assinar sem ter anúncio, e isso é travado no botão e nas
  // rotas que iniciam o pagamento.
  const hasProfile = userId ? await isUserACompanion(userId) : false;
  // Botão de compra de teste sem o mês grátis, só para admin com perfil.
  const adminTest = Boolean(userId && isAdmin(userId) && hasProfile);
  // Os planos são só para perfis verificados. Os preços continuam à vista,
  // com o caminho para a verificação; escolher um plano leva lá.
  const acesso = userId && hasProfile && !isAdmin(userId) ? await acessoAPlanos(userId) : null;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">{t.titulo}</h1>
      <p className="mb-4">{t.intro}</p>
      <div className="flex flex-col items-start justify-start my-6 p-6 border border-neutral-800 rounded-lg bg-card">
        <h2 className="text-neutral-100 text-xl">{t.mesGratis}</h2>
        <p className="text-lg text-neutral-400">{t.cancele}</p>
      </div>
      {acesso === 'sem-selo' && (
        <div className="my-6 p-4 border border-amber-300 bg-amber-50 rounded-lg dark:border-amber-900 dark:bg-amber-950/40">
          <p className="font-medium mb-1">{t.semSeloTitulo}</p>
          <p className="text-base text-muted-foreground mb-3">{t.semSeloTexto}</p>
          <LocaleLink
            locale={locale}
            href="/companions/verification"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
          >
            {t.semSeloBotao}
          </LocaleLink>
        </div>
      )}
      {acesso === 'em-revisao' && (
        <div className="my-6 p-4 border border-amber-300 bg-amber-50 rounded-lg dark:border-amber-900 dark:bg-amber-950/40">
          <p className="font-medium mb-1">{t.revisaoTitulo}</p>
          <p className="text-base text-muted-foreground">{t.revisaoTexto}</p>
        </div>
      )}
      {!hasProfile && (
        <div className="my-6 p-4 border border-amber-300 bg-amber-50 rounded-lg dark:border-amber-900 dark:bg-amber-950/40">
          <p className="font-medium mb-1">{t.semPerfilTitulo}</p>
          <p className="text-base text-muted-foreground mb-3">{t.semPerfilTexto}</p>
          <LocaleLink
            locale={locale}
            href="/companions/register"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
          >
            {t.semPerfilBotao}
          </LocaleLink>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRODUCTS[locale].map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            hasProfile={hasProfile}
            adminTest={adminTest}
          />
        ))}
      </div>
    </div>
  );
}

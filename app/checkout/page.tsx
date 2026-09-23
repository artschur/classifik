import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isUserACompanion } from '@/db/queries/companions';
import { ProductCard } from './productCard';
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
  const { userId, sessionClaims } = await auth();
  if (sessionClaims?.metadata?.isCompanion === false) {
    redirect('/location');
  }

  // Os preços ficam à vista mesmo sem perfil: é informação que ela precisa
  // para decidir se vale a pena investir o tempo do registo. O que não pode
  // acontecer é assinar sem ter anúncio, e isso é travado no botão e nas
  // rotas que iniciam o pagamento.
  const hasProfile = userId ? await isUserACompanion(userId) : false;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Selecione seu Anúncio</h1>
      <p className="mb-4">
        Escolha o seu anúncio. Após o pagamento, seu perfil será visível no topo
        do seu distrito, atraindo mais clientes.
      </p>
      <div className="flex flex-col items-start justify-start my-6 p-6 border border-neutral-800 rounded-lg bg-card">
        <h2 className="text-neutral-100 text-xl">
          Na escolha de um plano, o primeiro mês é grátis (apenas para as 15
          primeiras sugars)
        </h2>
        <p className="text-lg text-neutral-400">Cancele quando quiser!</p>
      </div>
      {!hasProfile && (
        <div className="my-6 p-4 border border-amber-300 bg-amber-50 rounded-lg dark:border-amber-900 dark:bg-amber-950/40">
          <p className="font-medium mb-1">
            Ainda não tem perfil criado.
          </p>
          <p className="text-base text-muted-foreground mb-3">
            Um plano serve para destacar o seu anúncio, por isso é preciso ter
            o anúncio primeiro. Veja aqui os preços à vontade e crie o perfil
            quando decidir: depois volta e escolhe o plano.
          </p>
          <Link
            href="/companions/register"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
          >
            Criar o meu perfil
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            hasProfile={hasProfile}
          />
        ))}
      </div>
    </div>
  );
}
